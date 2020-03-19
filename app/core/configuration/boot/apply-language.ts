import {UnorderedConfigurationDefinition} from '../model/unordered-configuration-definition';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function applyLanguage(language: any) {

    return (configuration: UnorderedConfigurationDefinition) => {

        if (configuration.types) {
            for (let confTypeName of Object.keys(configuration.types)) {
                const confType = configuration.types[confTypeName];

                if (language.types && language.types[confTypeName] && language.types[confTypeName].label) {
                    confType.label = language.types[confTypeName].label;
                }

                for (let confFieldName of Object.keys(confType.fields)) {
                    let descriptionFoundInTypes = false;
                    let labelFoundInTypes = false;

                    const confField = confType.fields[confFieldName];

                    if (language.types) {
                        const langConfType = language.types[confTypeName];
                        if (langConfType && langConfType.fields) {
                            const langConfField = langConfType.fields[confFieldName];
                            if (langConfField) {
                                if (langConfField.label) {
                                    labelFoundInTypes = true;
                                    confField.label = langConfField.label;
                                }
                                if (langConfField.description) {
                                    descriptionFoundInTypes = true;
                                    confField.description = langConfField.description;
                                }
                            }
                        }
                    }

                    if (!labelFoundInTypes && language.commons) {
                        if (language.commons[confFieldName] && language.commons[confFieldName].label) {
                            confField.label = language.commons[confFieldName].label;
                        }
                    }
                    if (!descriptionFoundInTypes && language.commons) {
                        if (language.commons[confFieldName] && language.commons[confFieldName].description) {
                            confField.description = language.commons[confFieldName].description;
                        }
                    }
                }
            }
        }

        if (language.relations) {
            for (let langConfRelationKey of Object.keys(language.relations)) {
                for (let confRelation of configuration.relations as any) {
                    if (confRelation.name !== langConfRelationKey) continue;

                    const langConfRelation = language.relations[langConfRelationKey];
                    if (langConfRelation.label) confRelation.label = langConfRelation.label;
                }
            }
        }

        return configuration;
    }
}