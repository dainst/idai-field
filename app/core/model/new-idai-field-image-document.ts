import {NewDocument} from 'idai-components-2/core';
import {IdaiFieldImageResource} from './idai-field-image-resource';
import {NewIdaiFieldImageResource} from "./new-idai-field-image-resource";

/**
 * @author Daniel de Oliveira
 */
export interface NewIdaiFieldImageDocument extends NewDocument {

    id?: string;
    resource: NewIdaiFieldImageResource;
}