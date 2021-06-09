import {Relations} from './relations'

export interface NewResource {

    id?: string;
    identifier: string;
    category: string;
    relations: Relations;
    [propName: string]: any;
}