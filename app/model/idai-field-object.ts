import {Entity} from "../core-services/entity";

export interface IdaiFieldObject extends Entity {
    synced: number;
    modified?: Date;
    created?: Date;
}