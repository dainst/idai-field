import {ImageRelations} from './image-relations';
import {ImageResourceBase} from './image-resource-base';
import {NewResource} from 'idai-components-2';

export interface NewImageResource extends NewResource, ImageResourceBase {

    relations: ImageRelations;
}