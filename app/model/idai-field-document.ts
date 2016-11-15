import {Document} from "idai-components-2/core";
import {IdaiFieldResource} from "./idai-field-resource";

export interface IdaiFieldDocument extends Document {
    synced: number;
    resource: IdaiFieldResource;
    id?: string;
}