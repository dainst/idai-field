import {IdaiFieldDocument} from "../model/idai-field-document";

export class IdaiFieldPolygon extends L.Polygon {

    private document: IdaiFieldDocument;

    public setDocument(document: IdaiFieldDocument) {
        this.document = document;
    }

    public getDocument(): IdaiFieldDocument {
        return this.document;
    }
}