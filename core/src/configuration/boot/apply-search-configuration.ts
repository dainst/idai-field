import {Map} from 'tsfun';
import {TransientCategoryDefinition} from '../model/transient-category-definition';


export function applySearchConfiguration(searchConfiguration: any) {

    return (categories: Map<TransientCategoryDefinition>) => {

        Object.keys(searchConfiguration).forEach(categoryName => {
            const category: TransientCategoryDefinition = categories[categoryName];
            if (!category) return;

            applySearchConfigurationForCategory(searchConfiguration, category, categoryName, 'fulltext',
                'fulltextIndexed');
            applySearchConfigurationForCategory(searchConfiguration, category, categoryName, 'constraint',
                'constraintIndexed');
        });

        return categories;
    }
}


function applySearchConfigurationForCategory(searchConfiguration: any, 
                                             category: TransientCategoryDefinition,
                                             categoryName: string, indexType: string,
                                             indexFieldName: string) {

    const fulltextFieldNames: string[]|undefined = searchConfiguration[categoryName][indexType];
    if (!fulltextFieldNames) return;

    fulltextFieldNames.forEach(fieldName => {
        const field = category.fields[fieldName];
        if (field) field[indexFieldName] = true;
    });
}
