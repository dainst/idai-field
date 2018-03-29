import {Resource} from 'idai-components-2/core';
import {IdaiFieldMediaRelations} from './idai-field-media-relations';


/**
 * @author Thomas Kleinke
 */
export interface IdaiField3DResource extends Resource {

    identifier: string;
    shortDescription: string;

    georeferenced: boolean;
    originalFilename: string;
    thumbnailWidth: number;
    thumbnailHeight: number;

    relations: IdaiFieldMediaRelations;
}