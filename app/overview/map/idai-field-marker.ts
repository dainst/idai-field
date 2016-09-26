import {IdaiFieldDocument} from "../../model/idai-field-document";

export interface IdaiFieldMarker extends L.Marker {

    document?: IdaiFieldDocument;
}