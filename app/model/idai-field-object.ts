import {Entity} from "idai-components-2/idai-components-2";

export interface IdaiFieldObject extends Entity {
    synced: number;
    modified?: Date;
    title: string;
    created?: Date;
}