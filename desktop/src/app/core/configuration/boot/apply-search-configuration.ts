import {Map} from 'tsfun';
import {CategoryDefinition} from 'idai-field-core';


export function applySearchConfiguration(searchConfiguration: any) {

    return (categories: Map<CategoryDefinition>) => {

        Object.keys(searchConfiguration).forEach(categoryName => {
            const category: CategoryDefinition = categories[categoryName];
            if (!category) return;

            applySearchConfigurationForCategory(searchConfiguration, category, categoryName, 'fulltext',
                'fulltextIndexed');
            applySearchConfigurationForCategory(searchConfiguration, category, categoryName, 'constraint',
                'constraintIndexed');
        });

        return categories;
    }
}


function applySearchConfigurationForCategory(searchConfiguration: any, category: CategoryDefinition,
                                             categoryName: string, indexType: string,
                                             indexFieldName: string) {

    const fulltextFieldNames: string[]|undefined = searchConfiguration[categoryName][indexType];
    if (!fulltextFieldNames) return;

    fulltextFieldNames.forEach(fieldName => {
        const field = category.fields[fieldName];
        if (field) field[indexFieldName] = true;
    });
}
