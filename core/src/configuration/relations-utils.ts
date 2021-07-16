import { Relation } from '../model';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export module RelationsUtil {

    export function getRelationDefinitions(relations: Array<Relation>,
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
