import {Resource} from 'idai-components-2/core';
import {IdaiField3DRelations} from './idai-field-3d-relations';


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

    relations: IdaiField3DRelations;
}