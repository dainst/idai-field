/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export function applyLanguageConfigurations(languageConfigurations: any[]) {

    return (configuration: [any, any]) => {

        const [categories, relations] = configuration;

        if (categories) {
            applyFields(languageConfigurations, categories);
            applyCategories(languageConfigurations, categories);
        }
        if (relations) applyRelations(languageConfigurations, relations);

        return [categories, relations];
    };
}


function applyFields(languageConfigurations: any[], categories: any) {

    for (const categoryName of Object.keys(categories)) {
        const category = categories[categoryName];

        for (const configurationCategoryFieldName of Object.keys(category.fields)) {
            for (let languageConfiguration of languageConfigurations) {
                if (languageConfiguration?.fields?.[configurationCategoryFieldName]) {
                    category.fields[configurationCategoryFieldName].label
                        = languageConfiguration.fields[configurationCategoryFieldName].label;
                    category.fields[configurationCategoryFieldName].description
                        = languageConfiguration.fields[configurationCategoryFieldName].description;
                    break;
                }
            }
        }
    }
}


function applyRelations(languageConfigurations: any[], relations: any) {

    for (const relation of relations) {
        for (let languageConfiguration of languageConfigurations) {
            if (languageConfiguration?.relations?.[relation.name]) {
                const languageConfigurationRelation = languageConfiguration.relations[relation.name];
                if (languageConfigurationRelation.label) {
                    relation.label = languageConfigurationRelation.label;
                    break;
                }
            }
        }
    }
}


function applyCategories(languageConfigurations: any[], categories: any) {

    for (const configurationCategoryName of Object.keys(categories)) {
        const configurationCategory = categories[configurationCategoryName];

        for (let languageConfiguration of languageConfigurations) {
            if (languageConfiguration.categories?.[configurationCategoryName]?.label) {
                configurationCategory.label
                    = languageConfiguration.categories[configurationCategoryName].label;
                break;
            }
        }

        for (const configurationFieldName of Object.keys(configurationCategory.fields)) {
            let descriptionFoundInCategories = false;
            let labelFoundInCategories = false;

            const configurationField = configurationCategory.fields[configurationFieldName];

            for (let languageConfiguration of languageConfigurations) {
                if (languageConfiguration.categories) {
                    const languageConfigurationCategory = languageConfiguration.categories[configurationCategoryName];
                    if (languageConfigurationCategory?.fields) {
                        const languageConfigurationField
                            = languageConfigurationCategory.fields[configurationFieldName];
                        if (languageConfigurationField) {
                            if (languageConfigurationField.label) {
                                labelFoundInCategories = true;
                                configurationField.label = languageConfigurationField.label;
                            }
                            if (languageConfigurationField.description) {
                                descriptionFoundInCategories = true;
                                configurationField.description = languageConfigurationField.description;
                            }
                            break;
                        }
                    }
                }
            }

            if (!labelFoundInCategories) {
                 for (let languageConfiguration of languageConfigurations) {
                    if (languageConfiguration.commons?.[configurationFieldName]?.label) {
                        configurationField.label = languageConfiguration.commons[configurationFieldName].label;
                        break;
                    }
                }
            }
            if (!descriptionFoundInCategories) {
                for (let languageConfiguration of languageConfigurations) {
                    if (languageConfiguration.commons?.[configurationFieldName]?.description) {
                        configurationField.description
                            = languageConfiguration.commons[configurationFieldName].description;
                        break;
                    }
                }
            }
        }
    }
}
