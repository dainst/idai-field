export interface IdaiFieldObject {
    id?: string;
    identifier: string;
    title: string;
    synced: number;
    modified?: Date;
    created?: Date;
    changed?: boolean;
    valid: boolean;
    type: string;
}