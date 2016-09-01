import {Resource} from "idai-components-2/idai-components-2";

export interface IdaiFieldResource extends Resource {
    identifier: string;
    title: string;
    geometries?: Array<any>;
}