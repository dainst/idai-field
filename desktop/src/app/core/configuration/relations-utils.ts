import {RelationDefinition} from 'idai-field-core';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export module RelationsUtil {

    export function getRelationDefinitions(relations: Array<RelationDefinition>,
                                           categoryName: string,
                                           isRangeCategory: boolean = false) {

        const availableRelationFields: Array<RelationDefinition> = [];

        for (let relationField of relations) {
            const categories: string[] = isRangeCategory ? relationField.range : relationField.domain;
            if (categories.indexOf(categoryName) > -1) availableRelationFields.push(relationField);
        }

        return availableRelationFields;
    }
}
