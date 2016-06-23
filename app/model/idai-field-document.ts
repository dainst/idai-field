import {Document} from "idai-components-2/idai-components-2";

export interface IdaiFieldDocument extends Document {
    synced: number;
    modified?: Date;
    created?: Date;
    resource: any;
}