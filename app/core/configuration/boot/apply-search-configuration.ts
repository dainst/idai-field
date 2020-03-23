import {UnorderedConfigurationDefinition} from '../model/unordered-configuration-definition';
import {CategoryDefinition} from '../model/category-definition';


export function applySearchConfiguration(searchConfiguration: any) {

    return (configuration: UnorderedConfigurationDefinition) => {

        Object.keys(searchConfiguration).forEach(categoryName => {
            const category: CategoryDefinition = configuration.categories[categoryName];
            if (!category) return;

            applySearchConfigurationForCategory(searchConfiguration, category, categoryName, 'fulltext',
                'fulltextIndexed');
            applySearchConfigurationForCategory(searchConfiguration, category, categoryName, 'constraint',
                'constraintIndexed');
        });

        return configuration;
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