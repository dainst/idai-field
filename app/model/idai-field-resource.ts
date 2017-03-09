import {Resource} from "idai-components-2/core";
import {IdaiFieldGeometry} from "./idai-field-geometry";

export interface IdaiFieldResource extends Resource {
    // as specified in AppComponent
    identifier: string;
    shortDescription: string;
    geometry?: IdaiFieldGeometry;
    // -
}