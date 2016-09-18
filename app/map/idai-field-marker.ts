import {IdaiFieldDocument} from "../model/idai-field-document";

export class IdaiFieldMarker extends L.Marker {

    private document: IdaiFieldDocument;

    public setDocument(document: IdaiFieldDocument) {
        this.document = document;
    }

    public getDocument(): IdaiFieldDocument {
        return this.document;
    }
}