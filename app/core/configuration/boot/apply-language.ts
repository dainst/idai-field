

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function applyLanguage(language: any) {

    return (configuration: any) => {

        if (configuration.categories) applyCategories(language, configuration);
        if (language.relations) applyRelations(language, configuration);

        return configuration;
    }
}


function applyRelations(language: any, configuration: any) {

    for (let languageConfigurationRelationKey of Object.keys(language.relations)) {
        for (let configurationRelation of configuration.relations as any) {
            if (configurationRelation.name !== languageConfigurationRelationKey) continue;

            const langConfRelation = language.relations[languageConfigurationRelationKey];
            if (langConfRelation.label) configurationRelation.label = langConfRelation.label;
        }
    }
}


function applyCategories(language: any, configuration: any) {

    for (let configurationCategoryName of Object.keys(configuration.categories)) {
        const configurationCategory = configuration.categories[configurationCategoryName];

        if (language.categories
            && language.categories[configurationCategoryName]
            && language.categories[configurationCategoryName].label) {
            configurationCategory.label = language.categories[configurationCategoryName].label;
        }

        for (let configurationFieldName of Object.keys(configurationCategory.fields)) {
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