import {Resource} from "idai-components-2/core";
import {IdaiFieldResource} from "./idai-field-resource";

export interface IdaiFieldImage extends Resource {
    identifier: string;
    filename: string;
    width: number;
    height: number;
    depicts?: string;
}