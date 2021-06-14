import { Category, FieldDefinition, I18nString } from 'idai-field-core';
import { CustomLanguageConfigurations,
    LanguageConfigurationUtil } from '../../../../src/app/core/configuration/language-configuration-util';


/**
 * @author Thomas Kleinke
 */
 describe('LanguageConfigurationUtil', () => {

    const categoryLabel: I18nString = {
        de: 'Test-Kategorie',
        en: 'Test category'
    };

    const categoryDescription: I18nString = {
        de: 'Beschreibungstext der Kategorie',
        en: 'Category description text'
    };

    const fieldLabel: I18nString = {
        de: 'Test-Feld',
        en: 'Test field'
    };

    const fieldDescription: I18nString = {
        de: 'Beschreibungstext des Feldes',
        en: 'Field description text'
    };

    const category: Category = {
        name: 'testCategory',
        label: categoryLabel,
        defaultLabel: categoryLabel,
        description: categoryDescription,
        defaultDescription: categoryDescription,
        children: [],
        parentCategory: undefined,
        isAbstract: false,
        groups: [],
        mustLieWithin: false,
        color: '#fff'
    };

    const field: FieldDefinition = {
        name: 'testField',
        label: fieldLabel,
        defaultLabel: fieldLabel,
        description: fieldDescription,
        defaultDescription: fieldDescription,
        inputType: 'text',
        group: 'stem'
    };


    it('Add new translations to custom language configurations for field', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                categories: {
                    testCategory: {
                        fields: {
                            testField: {
                                label: 'Altes Label',
                                description: 'Alte Beschreibung'
                            }
                        }
                    }
                }
            }
        };
        
        const editedLabel: I18nString = {
            de: 'Neues Label',
            en: 'New label'
        };

        const editedDescription: I18nString = {
            de: 'Neue Beschreibung',
            en: 'New description'
        };


        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            customLanguageConfigurations,
            editedLabel,
            editedDescription,
            category,
            field
        );

        expect(customLanguageConfigurations.de.categories.testCategory.fields.testField.label)
            .toBe('Neues Label');
        expect(customLanguageConfigurations.de.categories.testCategory.fields.testField.description)
            .toBe('Neue Beschreibung');
        expect(customLanguageConfigurations.en.categories.testCategory.fields.testField.label)
            .toBe('New label');
        expect(customLanguageConfigurations.en.categories.testCategory.fields.testField.description)
            .toBe('New description');
    });


    it('Remove deleted translations from custom language configurations for field', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                categories: {
                    testCategory: {
                        fields: {
                            testField: {
                                label: 'Altes Label',
                                description: 'Alte Beschreibung'
                            }
                        }
                    }
                }
            },
            en: {
                categories: {
                    testCategory: {
                        fields: {
                            testField: {
                                label: 'Old label',
                                description: 'Old description'
                            }
                        }
                    }
                }
            }
        };
        
        const editedLabel: I18nString = {
            de: 'Altes Label'
        };

        const editedDescription: I18nString = {};

        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            customLanguageConfigurations,
            editedLabel,
            editedDescription,
            category,
            field
        );

        expect(customLanguageConfigurations.de.categories.testCategory.fields.testField.label)
            .toBe('Altes Label');
        expect(customLanguageConfigurations.de.categories.testCategory.fields.testField.description)
            .toBeUndefined();
        expect(customLanguageConfigurations.en).toBeUndefined();
    });


    it('Remove translations equal to default translation from custom language configurations for field', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                categories: {
                    testCategory: {
                        fields: {
                            testField: {
                                label: 'Altes Label',
                                description: 'Alte Beschreibung'
                            }
                        }
                    }
                }
            }
        };
        
        const editedLabel: I18nString = {
            de: 'Test-Feld'
        };

        const editedDescription: I18nString = {
            de: 'Beschreibungstext des Feldes'
        };

        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            customLanguageConfigurations,
            editedLabel,
            editedDescription,
            category,
            field
        );

        expect(customLanguageConfigurations.de).toBeUndefined();
    });
});
