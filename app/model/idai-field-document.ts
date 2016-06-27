import {Document} from "idai-components-2/idai-components-2";
import {IdaiFieldResource} from "./idai-field-resource";

export interface IdaiFieldDocument extends Document {
    synced: number;
    resource: IdaiFieldResource;
    id?: string;
}