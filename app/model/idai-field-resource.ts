import {Resource} from "idai-components-2/idai-components-2";
import {IdaiFieldGeometry} from "./idai-field-geometry";

export interface IdaiFieldResource extends Resource {
    identifier: string;
    shortDescription: string;
    geometries?: Array<IdaiFieldGeometry>;
}