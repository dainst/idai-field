import {ImageRelations} from './image-relations';
import {ImageResourceBase} from './image-resource-base';
import {Resource} from './resource';


export interface ImageResource extends Resource, ImageResourceBase {

    relations: ImageRelations;
}