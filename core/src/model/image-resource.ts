import {ImageRelations} from './image-relations';
import {ImageResourceBase} from './image-resource-base';
import {Resource} from 'idai-components-2';


export interface ImageResource extends Resource, ImageResourceBase {

    relations: ImageRelations;
}