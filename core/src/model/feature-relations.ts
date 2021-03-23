import {FieldRelations} from './field-relations';

/**
 * @author Daniel de Oliveira
 */
export interface FeatureRelations extends FieldRelations {

    isContemporaryWith: string[];
    isAfter: string[];
    isBefore: string[];
}