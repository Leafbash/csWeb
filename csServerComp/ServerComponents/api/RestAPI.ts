import LayerManager = require('./LayerManager');
import express = require('express')
import cors = require('cors')
import Layer = LayerManager.Layer;
import Logs = LayerManager.Log;
import BaseConnector = require('./BaseConnector');
import CallbackResult = LayerManager.CallbackResult;


export class RestAPI extends BaseConnector.BaseConnector {

    public manager: LayerManager.LayerManager

    constructor(public server: express.Express, public baseUrl: string = "/api/layers/") {
        super();
        this.isInterface = true;
    }

    public init(layerManager: LayerManager.LayerManager, options: any) {
        this.manager = layerManager;
        console.log('init Rest API');

        //enables cors, used for external swagger requests
        this.server.use(cors());


        this.server.get(this.baseUrl, (req: express.Request, res: express.Response) => {
            res.send(JSON.stringify(this.manager.layers));
        });

        //------ layer API paths, in CRUD order

        // adds a layer, using HTTP PUT, stores it in a collection of choice
        // TODO: error checking: you might not want to overwrite another layer
        // Or post to a layer collection that should be shielded-off (e.g. system or users)
        // And what if an agent starts sending gibberish?
        this.server.post(this.baseUrl + ':layer', (req: express.Request, res: express.Response) => {
            var layer = new Layer();
            layer.features = req.body.features;
            layer.id = req.params.layer;
            this.manager.addLayer(layer, (result: CallbackResult) => {
                //todo: check errors
                //returns success of insert operation
                res.send(result);
            });
        })

        // gets the entire layer, which is stored as a single collection
        // TODO: what to do when this gets really big? Offer a promise?
        this.server.get(this.baseUrl + ':layerId', (req: any, res: any) => {
            this.manager.getLayer(req.params.layerId, (result: CallbackResult) => {
                //todo: check error
                res.send(result.layer);
            });
        })

        // gets the entire layer, which is stored as a single collection
        // TODO: what to do when this gets really big? Offer a promise?
        this.server.delete(this.baseUrl + ':layerId', (req: any, res: any) => {
            this.manager.deleteLayer(req.params.layerId, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        })

        //------ feature API paths, in CRUD order

        //adds a feature
        this.server.post(this.baseUrl + ":layerId/feature", (req: express.Request, res: express.Response) => {
            this.manager.addFeature(req.params.layerId, req.body, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });

        //returns a feature
        this.server.get(this.baseUrl + ":layerId/:featureId", (req: express.Request, res: express.Response) => {
            this.manager.getFeature(req.params.layerId, req.params.featureId, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });

        // updates all features corresponding to query on ID (should be one)
        this.server.put(this.baseUrl + ":layerId/:featureId", (req: express.Request, res: express.Response) => {
            var feature = req.body;
            feature.id = req.params.featureId;
            this.manager.updateFeature(req.params.layerId, feature, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });

        // updates all features corresponding to query on ID (should be one)
        this.server.put(this.baseUrl + ":layerId/:featureId/prop/:property", (req: express.Request, res: express.Response) => {
            this.manager.updateProperty(req.params.layerId, req.params.featureId, req.params.property, req.body, true, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });

        // updates all features corresponding to query on ID (should be one)
        this.server.put(this.baseUrl + ":layerId/:featureId/logs", (req: express.Request, res: express.Response) => {
            var logs: { [key: string]: Logs[] };
            logs = req.body;
            this.manager.updateLogs(req.params.layerId, req.params.featureId, logs, (result: CallbackResult) => {
                //todo: check error
                res.send(result);

            });
        });

        // for some reason (TS?) express doesn't work with del as http verb
        // unlike the JS version, which simply uses del as a keyword.
        // deletes a feature
        this.server.delete(this.baseUrl + ":layerId/features/:featureId", (req: express.Request, res: express.Response) => {
            this.manager.addFeature(req.params.layerId, req.params.featureId, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });


    }

    public initLayer(layer: Layer) {

    }

}