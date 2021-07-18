import {ImageRelations} from './image-relations';
import {ImageResourceBase} from './image-resource-base';
import {NewResource, Resource} from './resource';


export interface NewImageResource extends NewResource, ImageResourceBase {

    relations: ImageRelations;
}


export interface ImageResource extends Resource, ImageResourceBase {

    relations: ImageRelations;
}