import {IdaiFieldImageRelations} from './idai-field-image-relations';
import {NewResource} from 'idai-components-2/core';
import {IdaiFieldImageResourceBase} from "./idai-field-image-resource-base";

export interface NewIdaiFieldImageResource
    extends NewResource, IdaiFieldImageResourceBase {

    relations: IdaiFieldImageRelations;
}