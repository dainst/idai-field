import {IdaiFieldDocument} from "../../model/idai-field-document";

export interface IdaiFieldPolygon extends L.Polygon {

    document?: IdaiFieldDocument;
}