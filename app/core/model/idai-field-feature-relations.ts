import {IdaiFieldRelations} from "idai-components-2/field";

/**
 * @author Daniel de Oliveira
 */
export interface IdaiFieldFeatureRelations extends IdaiFieldRelations {

    isContemporaryWith: string[];
    isAfter: string[];
    isBefore: string[];
}