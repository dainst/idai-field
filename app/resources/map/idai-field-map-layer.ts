import {IdaiFieldGeoreference} from "../../model/idai-field-georeference";

export interface IdaiFieldMapLayer {

    id: string;
    name: string;
    filePath: string;
    georeference: IdaiFieldGeoreference;
    zIndex: number;
    object?: L.ImageOverlay;
}