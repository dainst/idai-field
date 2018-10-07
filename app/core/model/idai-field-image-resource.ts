import {Resource, IdaiFieldGeoreference} from 'idai-components-2';
import {IdaiFieldMediaRelations} from './idai-field-media-relations';

export interface IdaiFieldImageResource extends Resource {

    identifier: string;
    shortDescription: string;

    originalFilename: string;
    width: number;
    height: number;

    georeference?: IdaiFieldGeoreference;
    georeferenceHeight?: number;

    relations: IdaiFieldMediaRelations;
}