import {IdaiFieldImageRelations} from './idai-field-image-relations';
import {Resource} from 'idai-components-2/core';
import {IdaiFieldImageResourceBase} from "./idai-field-image-resource-base";
import {IdaiFieldFeatureRelations} from './idai-field-feature-relations';


export interface IdaiFieldFeatureResource
    extends Resource {

    relations: IdaiFieldFeatureRelations;
}