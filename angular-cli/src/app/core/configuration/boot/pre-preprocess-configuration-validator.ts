import {intersection, subtract} from 'tsfun';
import {RelationDefinition} from '../model/relation-definition';

/**
 * Used to validate to configuration in the form it comes from the user, i.e.
 * as Configuration.json. This means before the preprocess step has been executed,
 * where additional hardcoded definitions from app configurators may come in.
 *
 * @author Daniel de Oliveira
 */
export class PrePreprocessConfigurationValidator {


    private static evaluateRelationDomain(relation: RelationDefinition, appConfiguration: any) {

        if (intersection([relation.domain, this.imageCategories(appConfiguration)]).length > 0) {
            return (['image category/isRecordedIn must not be defined manually', relation] as any);
        } else if (intersection([relation.domain, this.operationSubcategories(appConfiguration)]).length > 0) {
            return ['operation subcategory as domain category/isRecordedIn must not be defined manually',
                relation] as any;
        } else {
            if (subtract(this.operationSubcategories(appConfiguration))(relation.domain).length > 0) {
                for (let rangeCategory of relation.range) {
                    if (!this.operationSubcategories(appConfiguration).includes(rangeCategory)) {
                        return ['isRecordedIn - only operation subcategories allowed in range', relation] as any;
                    }
                }
            }
        }
    }


    private static operationSubcategories(appConfiguration: any) {

        return Object.keys(appConfiguration.categories)
            .filter(categoryName => appConfiguration.categories[categoryName].parent === 'Operation');
    }


    private static imageCategories(appConfiguration: any) {

        return Object.keys(appConfiguration.categories)
            .filter(categoryName => appConfiguration.categories[categoryName].parent === 'Image')
            .concat(['Image']);
    }
}