import {NewImageResource} from './new-image-resource';
import {NewDocument} from 'idai-components-2';

/**
 * @author Daniel de Oliveira
 */
export interface NewImageDocument extends NewDocument {

    id?: string;
    resource: NewImageResource;
}