import {Resource} from "idai-components-2/core";
import {IdaiFieldGeometry} from "./idai-field-geometry";
import {IdaiFieldImage} from "./idai-field-image";

export interface IdaiFieldResource extends Resource {
    identifier: string;
    shortDescription: string;
    geometries?: Array<IdaiFieldGeometry>;
    images?: Array<string>;
}