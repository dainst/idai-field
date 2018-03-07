import {IdaiFieldGeoreference} from './idai-field-georeference';

export interface IdaiFieldImageResourceBase {

    identifier: string;
    shortDescription: string;

    originalFilename: string;
    width: number;
    height: number;
    georeference?: IdaiFieldGeoreference;
}