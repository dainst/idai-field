import {Resource} from "idai-components-2/core";
import {IdaiFieldGeoreference} from "../model/idai-field-georeference";
import {IdaiFieldGeometry} from "./idai-field-geometry";

export interface IdaiFieldImageResource extends Resource {
    // as specified in AppComponent
    identifier: string;
    shortDescription: string;
    geometries?: Array<IdaiFieldGeometry>;
    // - see also IdaiFieldResource


    filename: string;
    width: number;
    height: number;
    georeference?: IdaiFieldGeoreference;
}