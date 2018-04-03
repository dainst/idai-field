import {Relations} from "idai-components-2/core";

/**
 * @author Daniel de Oliveira
 */
export interface IdaiFieldFeatureRelations extends Relations {

    isContemporaryWith: string[];
    isAfter: string[];
    isBefore: string[];
}