import {Resource} from "idai-components-2/core";

export interface IdaiFieldImageResource extends Resource {
    identifier: string;
    filename: string;
    width: number;
    height: number;
    depicts?: string;
}