import {Resource} from 'idai-components-2/core';
import {IdaiFieldGeoreference} from './idai-field-georeference';
import {IdaiFieldMediaRelations} from './idai-field-media-relations';

export interface IdaiFieldImageResource extends Resource {

    identifier: string;
    shortDescription: string;

    originalFilename: string;
    width: number;
    height: number;
    georeference?: IdaiFieldGeoreference;

    relations: IdaiFieldMediaRelations;
}