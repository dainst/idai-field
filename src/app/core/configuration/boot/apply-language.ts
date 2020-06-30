

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function applyLanguage(language: any) {

    return (configuration: [any, any]) => {

        const [categories, relations] = configuration;

        if (categories) {
            applyFields(language, categories);
            applyCategories(language, categories);
        }
        if (language.relations) applyRelations(language, relations);

        return [categories, relations];
    };
}


function applyFields(language: any, categories: any) {

    if (!language.fields) return;

    for (const languageConfigurationFieldKey of Object.keys(language.fields)) {
        for (const configurationCategoryName of Object.keys(categories)) {
            const configurationCategory = categories[configurationCategoryName];

            for (const configurationCategoryFieldName of Object.keys(configurationCategory.fields)) {
                if (configurationCategoryFieldName !== languageConfigurationFieldKey) continue;

                configurationCategory.fields[configurationCategoryFieldName].label
                    = language.fields[languageConfigurationFieldKey].label;
                configurationCategory.fields[configurationCategoryFieldName].description
                    = language.fields[languageConfigurationFieldKey].description;
            }
        }
    }
}


function applyRelations(language: any, relations: any) {

    for (const languageConfigurationRelationKey of Object.keys(language.relations)) {
        for (const configurationRelation of relations as any) {
            if (configurationRelation.name !== languageConfigurationRelationKey) continue;

            const langConfRelation = language.relations[languageConfigurationRelationKey];
            if (langConfRelation.label) configurationRelation.label = langConfRelation.label;
        }
    }
}


function applyCategories(language: any, categories: any) {

    for (const configurationCategoryName of Object.keys(categories)) {
        const configurationCategory = categories[configurationCategoryName];

        if (language.categories
            && language.categories[configurationCategoryName]
            && language.categories[configurationCategoryName].label) {
            configurationCategory.label = language.categories[configurationCategoryName].label;
        }

        for (const configurationFieldName of Object.keys(configurationCategory.fields)) {
            let descriptionFoundInCategories = false;
            let labelFoundInCategories = false;

            const configurationField = configurationCategory.fields[configurationFieldName];

            if (language.categories) {
                const languageConfigurationCategory = language.categories[configurationCategoryName];
                if (languageConfigurationCategory && languageConfigurationCategory.fields) {
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
                    }
                }
            }

            if (!labelFoundInCategories && language.commons) {
                if (language.commons[configurationFieldName]
                    && language.commons[configurationFieldName].label) {
                    configurationField.label = language.commons[configurationFieldName].label;
                }
            }
            if (!descriptionFoundInCategories && language.commons) {
                if (language.commons[configurationFieldName]
                    && language.commons[configurationFieldName].description) {
                    configurationField.description
                        = language.commons[configurationFieldName].description;
                }
            }
        }
    }
}
