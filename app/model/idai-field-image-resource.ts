import {Resource} from "idai-components-2/core";
import {IdaiFieldGeoreference} from "../model/idai-field-georeference";

export interface IdaiFieldImageResource extends Resource {
    identifier: string;
    filename: string;
    width: number;
    height: number;
    depicts?: string;
    georeference?: IdaiFieldGeoreference;
}