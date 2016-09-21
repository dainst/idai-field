import {IdaiFieldDocument} from "../../model/idai-field-document";

export interface IdaiFieldPolygon extends L.Polygon {

    document?: IdaiFieldDocument;

    // TODO Remove this as soon as the typings file for Leaflet 1.0.0-rc.3 has been completed
    on?(type: string, fn: any, context?: any): any;
}