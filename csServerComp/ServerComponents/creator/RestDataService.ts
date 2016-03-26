import express = require('express')
import cors = require('cors')
import Winston = require('winston');
import request = require('request');
import path = require('path');
import fs = require('fs-extra');
import _ = require('underscore');
import GeoJSONHelper = require('../helpers/GeoJSON');
import Api = require('../api/ApiManager');
import Utils = require('../helpers/Utils');

export interface IRestDataSourceSettings {
    converterFile: string;
    url: string;
    /** Parameters to include in the url (e.g. ./endpoint?api_key=value) */
    urlParams?: { [key: string]: any };
    pollIntervalSeconds?: number;
    pruneIntervalSeconds?: number;
    diffIgnoreGeometry?: boolean;
    diffPropertiesBlacklist?: string[];
    diffPropertiesWhitelist?: string[];
}

export interface IConverter {
    getData: Function;
}

interface IFeatureUpdate {
    f: GeoJSONHelper.IFeature;
    updated: number;
}

/** REST datasource
 *  Provides an endpoint for obtaining features from a REST source. The features can be provided in many forms, 
 *  as they will be converted by a specific converter-JavaScript file. The converter takes care of the conversion
 *  from the format used by the REST source to GeoJSON. 
 *  Furthermore the datasource will request the GeoJSON features on a certain interval. Only the features that have
 *  been updated in the interval period will be pushed to the client. Next to the polling interval, a prune period 
 *  can be configured. When features have not been updated within the prune period, they will be deleted. 
 */
export class RestDataSource {
    /** Dictionary of feature id's and information regarding the features and feature0updates */
    private features: { [id: string]: IFeatureUpdate };
    /** Features that should be added on the client */
    private featuresUpdates: Api.IChangeEvent[] = [];
    private restDataSourceUrl: string;
    private converter: IConverter;
    private restDataSourceOpts: IRestDataSourceSettings = <IRestDataSourceSettings>{};
    private counter: number;

    constructor(public server: express.Express, private apiManager: Api.ApiManager, public layerId: string, public url: string = '/restdatasource') {
        this.restDataSourceUrl = url;
        this.layerId = layerId;
    }

    public init(options: IRestDataSourceSettings, callback: Function) {
        if (!options || !options.converterFile) {
            callback('Rest datasource not started: No converterfile provided.');
            return;
        }
        Winston.info('Init Rest datasource on port ' + this.server.get('port') + '. Base path is ' + this.url);
        this.counter = 1;

        this.restDataSourceOpts.converterFile = options.converterFile;
        this.restDataSourceOpts.url = options.url;
        this.restDataSourceOpts.urlParams = options.urlParams || {};
        this.restDataSourceOpts.pollIntervalSeconds = options.pollIntervalSeconds || 60;
        this.restDataSourceOpts.pruneIntervalSeconds = options.pruneIntervalSeconds || 300;
        this.restDataSourceOpts.diffIgnoreGeometry = (options.hasOwnProperty('diffIgnoreGeometry')) ? false : options['diffIgnoreGeometry'];
        this.restDataSourceOpts.diffPropertiesBlacklist = options.diffPropertiesBlacklist || [];
        this.restDataSourceOpts.diffPropertiesWhitelist = options.diffPropertiesWhitelist || [];

        if (this.restDataSourceOpts.diffPropertiesBlacklist.length > 0 && this.restDataSourceOpts.diffPropertiesWhitelist.length > 0) {
            Winston.info('Both whitelist and blacklist properties provided, ignoring the blacklist.');
            this.restDataSourceOpts.diffPropertiesBlacklist.length = 0;
        }

        if (!fs.existsSync(this.restDataSourceOpts.converterFile)) {
            callback(`Provided converterfile not found. (${this.restDataSourceOpts.converterFile})`);
            return;
        }

        this.converter = require(this.restDataSourceOpts.converterFile);
        if (!this.isConverterValid()) {
            callback(`Provided converterfile not valid. (${path.basename(this.restDataSourceOpts.converterFile)})`);
            return;
        }

        var urlDataParams = this.restDataSourceOpts.urlParams;
        urlDataParams['url'] = this.restDataSourceOpts.url;
        this.startRestPolling(urlDataParams);

        this.server.get(this.restDataSourceUrl, (req: express.Request, res: express.Response) => {
            Winston.info('Restdatasource got request');
            var layerDef = req.body;
            if (!layerDef || !this.converter || !this.features) {
                res.sendStatus(404);
                return;
            }
            layerDef.features = _.map(this.features, (val, key) => { return val.f; });
            res.send(layerDef);
        });

        callback('Loaded successfully!');
    }

    private startRestPolling(dataParameters) {
        dataParameters['counter'] = this.counter++;
        this.converter.getData(request, dataParameters, {apiManager: this.apiManager, fs: fs}, (result) => {
            Winston.info('RestDataSource received ' + result.length || 0 + ' features');
            var featureCollection = GeoJSONHelper.GeoJSONFactory.Create(result);
            if (!this.features || Object.keys(this.features).length === 0) {
                this.initFeatures(featureCollection, Date.now());
            } else {
                this.findFeatureDiff(featureCollection, Date.now());
            }
        });

        setTimeout(() => { this.startRestPolling(dataParameters) }, this.restDataSourceOpts.pollIntervalSeconds * 1000);
    }

    private initFeatures(fCollection: GeoJSONHelper.IGeoJson, updateTime: number) {
        if (!fCollection || !fCollection.features) return;
        if (!this.features) this.features = {};
        if (_.isArray(fCollection.features)) {
            fCollection.features.forEach((f: GeoJSONHelper.IFeature, ind) => {
                this.features[f.id] = { f: f, updated: updateTime };
                if (ind === fCollection.features.length - 1) {
                    Winston.info('RestDataSource initialized ' + fCollection.features.length + ' features.');
                }
            });
        }
    }

    private findFeatureDiff(fCollection: GeoJSONHelper.IGeoJson, updateTime: number) {
        if (!fCollection || !fCollection.features) return;
        this.featuresUpdates.length = 0;
        let notUpdated = 0, updated = 0, added = 0, removed = 0;
        let fts = fCollection.features;
        let fCollectionIds = [];
        if (_.isArray(fts)) {
            fts.forEach((f) => {
                fCollectionIds.push(f.id);
                if (!this.features.hasOwnProperty(f.id)) {
                    // ADD FEATURE
                    this.features[f.id] = { f: f, updated: updateTime };
                    this.featuresUpdates.push(<Api.IChangeEvent>{ value: f, type: Api.ChangeType.Create, id: f.id });
                    added += 1;
                } else if (!this.isFeatureUpdated(f)) {
                    // NO UPDATE
                    notUpdated += 1;
                } else {
                    // UPDATE
                    this.features[f.id] = { f: f, updated: updateTime };
                    this.featuresUpdates.push(<Api.IChangeEvent>{ value: f, type: Api.ChangeType.Update, id: f.id });
                    updated += 1;
                }
            });
        }
        // CHECK INACTIVE FEATURES
        let inactiveFeatures = _.difference(Object.keys(this.features), fCollectionIds);
        if (inactiveFeatures && inactiveFeatures.length > 0) {
            inactiveFeatures.forEach((fId) => {
                if ((updateTime - this.features[fId].updated) >= (this.restDataSourceOpts.pruneIntervalSeconds * 1000)) {
                    // REMOVE
                    this.featuresUpdates.push(<Api.IChangeEvent>{ value: this.features[fId].f, type: Api.ChangeType.Delete, id: this.features[fId].f.id });
                    delete this.features[this.features[fId].f.id];
                    removed += 1;
                }
            });
        }
        this.apiManager.addUpdateFeatureBatch(this.layerId, this.featuresUpdates, {}, (r) => { });
        Winston.info(`Feature diff complete. ${updated} updated \t${added} added \t${notUpdated} not updated \t${removed} removed. (${this.counter})`);
    }

    private isFeatureUpdated(f: Api.Feature): boolean {
        if (!f) return false;
        // Check geometry
        if (!this.restDataSourceOpts.diffIgnoreGeometry && !_.isEqual(f.geometry, this.features[f.id].f.geometry)) {
            return true;
        }
        if (!f.properties) return false;
        // Check for blacklisted properties
        if (this.restDataSourceOpts.diffPropertiesBlacklist.length > 0) {
            let blacklist = this.restDataSourceOpts.diffPropertiesBlacklist;
            if (_.isEqual(_.omit(f.properties, blacklist), _.omit(this.features[f.id].f.properties, blacklist))) {
                return false;
            }
        }
        // Check for whitelisted properties
        if (this.restDataSourceOpts.diffPropertiesWhitelist.length > 0) {
            let whitelist = this.restDataSourceOpts.diffPropertiesWhitelist;
            if (_.isEqual(_.pick(f.properties, whitelist), _.pick(this.features[f.id].f.properties, whitelist))) {
                return false;
            }
        }
        // Check all properties
        if (_.isEqual(f.properties, this.features[f.id].f.properties)) {
            return false;
        }
        return true;
    }

    private isConverterValid(): boolean {
        let valid: boolean = true;
        Winston.info(`${Object.keys(this.converter)}`)
        valid = (this.converter.getData && typeof this.converter.getData === 'function');
        return valid;
    }
}
