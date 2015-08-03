import LayerManager = require('./LayerManager');
import Layer = LayerManager.Layer;
import Feature = LayerManager.Feature;
import CallbackResult = LayerManager.CallbackResult;
import Log = LayerManager.Log;
import Sensor = LayerManager.Sensor;
import SensorValue = LayerManager.SensorValue;

export class BaseConnector implements LayerManager.IConnector {
    public manager: LayerManager.LayerManager

    public id: string;
    public isInterface: boolean;

    public initLayer(layer: Layer) {

    }

    // layer methods first, in crud order.

    public addLayer(layer: Layer, callback: Function) {

    }

    public getLayer(layerId: string, callback: Function) {

    }

    public updateLayer(layerId: string, update: any, callback: Function) {
    }

    public deleteLayer(layerId: string, callback: Function) {

    }


    // feature methods, in crud order

    public addFeature(layerId: string, feature: any, callback: Function) {

    }

    //TODO: implement
    public getFeature(layerId: string, i: string, callback: Function) {

    }

    //TODO: implement
    public updateFeature(layerId: string, feature: any, useLog: boolean, callback: Function) {

    }

    //TODO: test further. Result is the # of deleted docs.
    public deleteFeature(layerId: string, featureId: string, callback: Function) {

    }

    public updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, callback: Function) {

    }

    public addLog(layerId: string, featureId: string, property: any, callback: Function) {

    }

    public updateLogs(layerId: string, featureId: string, logs: { [key: string]: Log[] }, callback: Function) {

    }

    //sensor methods
    public addSensor(sensor: Sensor, callback: Function) { }
    public addSensorValue(sensorId: string, value: SensorValue, callback: Function) { }
    public getSensors(callback: Function) { }
    public getSensor(sensorId: string) { }

    public addLog(layerId: string, featureId: string, log: Log, callback: Function) {

    }

    public getLog(layerId: string, featureId: string, callback: Function) {

    }

    public deleteLog(layerId: string, featureId: string, ts: number, prop: string, callback: Function) {

    }

    public getBBox(layerId: string, southWest: number[], northEast: number[], callback: Function) {

    }

    public getSphere(layerId: string, maxDistance: number, longtitude: number, latitude: number, callback: Function) {

    }

    public getWithinPolygon(layerId: string, feature: Feature, callback: Function) {

    }

    //TODO: Move connection set-up params from static to parameterized.
    public init(layerManager: LayerManager.LayerManager, options: any) {

    }
}