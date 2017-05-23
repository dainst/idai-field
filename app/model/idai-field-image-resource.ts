import {Resource} from 'idai-components-2/core';
import {IdaiFieldGeoreference} from '../model/idai-field-georeference';
import {IdaiFieldGeometry} from 'idai-components-2/idai-field-model';

export interface IdaiFieldImageResource extends Resource {
    // as specified in AppComponent
    identifier: string;
    shortDescription: string;
    geometry: IdaiFieldGeometry;
    // - see also IdaiFieldResource


    filename: string;
    width: number;
    height: number;
    georeference?: IdaiFieldGeoreference;
}