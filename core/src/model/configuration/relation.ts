import { Field } from './field';


/**
 * @author Daniel de Oliveira
 */
export interface Relation extends Field {

    domain: string[];
    range: string[];
    inverse?: any;
    sameMainCategoryResource?: boolean;
}


export namespace Relation {

    export const DOMAIN = 'domain';
    export const RANGE = 'range';


    export function getRelations(relations: Array<Relation>,
                                 categoryName: string,
                                 isRangeCategory: boolean = false) {

        const availableRelationFields: Array<Relation> = [];

        for (let relationField of relations) {
            const categories: string[] = isRangeCategory ? relationField.range : relationField.domain;
            if (categories.indexOf(categoryName) > -1) availableRelationFields.push(relationField);
        }

        return availableRelationFields;
    }
}
