import {IdaiFieldResource} from 'idai-components-2/idai-field-model';
import {IdaiFieldGeoreference} from './idai-field-georeference';
import {IdaiFieldImageRelations} from './idai-field-image-relations';

export interface IdaiFieldImageResource extends IdaiFieldResource {

    originalFilename: string;
    width: number;
    height: number;
    georeference?: IdaiFieldGeoreference;

    relations: IdaiFieldImageRelations;
}