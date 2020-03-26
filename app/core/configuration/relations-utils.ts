import {RelationDefinition} from './model/relation-definition';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export module RelationsUtil {

    export function getRelationDefinitions(relations: Array<RelationDefinition>,
                                           categoryName: string,
                                           isRangeCategory: boolean = false,
                                           property?: string) {

        const availableRelationFields: Array<RelationDefinition> = [];
        for (let relationField of relations) {

            const categories: string[] = isRangeCategory ? relationField.range : relationField.domain;
            if (categories.indexOf(categoryName) > -1) {
                if (!property ||
                    (relationField as any)[property] == undefined ||
                    (relationField as any)[property] == true) {
                    availableRelationFields.push(relationField);
                }
            }
        }
        return availableRelationFields;
    }
}
