import {Relation} from "./relation";

export interface IdaiFieldObject {
    id?: string;
    identifier: string;
    title: string;
    synced: number;
    modified?: Date;
    created?: Date;
    valid: boolean;
    type: string;
    relations: Relation[];
}