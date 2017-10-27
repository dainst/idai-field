import {IdaiFieldGeoreference} from './idai-field-georeference';
import {IdaiFieldImageRelations} from './idai-field-image-relations';
import {Resource} from 'idai-components-2/core';

export interface IdaiFieldImageResource extends Resource {

    identifier: string;
    shortDescription: string;

    originalFilename: string;
    width: number;
    height: number;
    georeference?: IdaiFieldGeoreference;

    relations: IdaiFieldImageRelations;
}