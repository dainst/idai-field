import { Category, Field, I18N, Group } from 'idai-field-core';
import { CustomLanguageConfigurations,
    LanguageConfigurationUtil } from '../../../../src/app/core/configuration/language-configuration-util';


/**
 * @author Thomas Kleinke
 */
 describe('LanguageConfigurationUtil', () => {

    const categoryLabel: I18N.String = {
        de: 'Test-Kategorie',
        en: 'Test category'
    };

    const categoryDescription: I18N.String = {
        de: 'Beschreibungstext der Kategorie',
        en: 'Category description text'
    };

    const fieldLabel: I18N.String = {
        de: 'Test-Feld',
        en: 'Test field'
    };

    const fieldDescription: I18N.String = {
        de: 'Beschreibungstext des Feldes',
        en: 'Field description text'
    };

    const groupLabel: I18N.String = {
        de: 'Test-Gruppe',
        en: 'Test group'
    };

    const category: Category = {
        name: 'testCategory',
        categoryName: 'testCategory',
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

    const field: Field = {
        name: 'testField',
        label: fieldLabel,
        defaultLabel: fieldLabel,
        description: fieldDescription,
        defaultDescription: fieldDescription,
        inputType: 'text'
    };

    const group: Group = {
        name: 'testGroup',
        label: groupLabel,
        defaultLabel: groupLabel,
        fields: []
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

        const editedLabel: I18N.String = {
            de: 'Neues Label',
            en: 'New label'
        };

        const editedDescription: I18N.String = {
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


    it('Add new translations to custom language configurations for category', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                categories: {
                    testCategory: {
                        label: 'Altes Label',
                        description: 'Alte Beschreibung'
                    }
                }
            }
        };

        const editedLabel: I18N.String = {
            de: 'Neues Label',
            en: 'New label'
        };

        const editedDescription: I18N.String = {
            de: 'Neue Beschreibung',
            en: 'New description'
        };


        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            customLanguageConfigurations,
            editedLabel,
            editedDescription,
            category
        );

        expect(customLanguageConfigurations.de.categories.testCategory.label).toBe('Neues Label');
        expect(customLanguageConfigurations.de.categories.testCategory.description).toBe('Neue Beschreibung');
        expect(customLanguageConfigurations.en.categories.testCategory.label).toBe('New label');
        expect(customLanguageConfigurations.en.categories.testCategory.description).toBe('New description');
    });


    it('Add new translations to custom language configurations for group', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                categories: {}
            }
        };

        const editedLabel: I18N.String = {
            de: 'Neues Label',
            en: 'New label'
        };


        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            customLanguageConfigurations,
            editedLabel,
            undefined,
            undefined,
            undefined,
            group
        );

        expect(customLanguageConfigurations.de.groups.testGroup).toBe('Neues Label');
        expect(customLanguageConfigurations.en.groups.testGroup).toBe('New label');
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

        const editedLabel: I18N.String = {
            de: 'Altes Label'
        };

        const editedDescription: I18N.String = {};

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


    it('Remove deleted translations from custom language configurations for category', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                categories: {
                    testCategory: {
                        label: 'Altes Label',
                        description: 'Alte Beschreibung'
                    }
                }
            },
            en: {
                categories: {
                    testCategory: {
                        label: 'Old label',
                        description: 'Old description'
                    }
                }
            }
        };

        const editedLabel: I18N.String = {
            de: 'Altes Label'
        };

        const editedDescription: I18N.String = {};

        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            customLanguageConfigurations,
            editedLabel,
            editedDescription,
            category
        );

        expect(customLanguageConfigurations.de.categories.testCategory.label).toBe('Altes Label');
        expect(customLanguageConfigurations.de.categories.testCategory.description).toBeUndefined();
        expect(customLanguageConfigurations.en).toBeUndefined();
    });


    it('Remove deleted translations from custom language configurations for group', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                groups: {
                    testGroup: 'Altes Label'
                }
            },
            en: {
                groups: {
                    testGroup: 'Old label'
                }
            }
        };

        const editedLabel: I18N.String = {
            de: 'Altes Label'
        };

        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            customLanguageConfigurations,
            editedLabel,
            undefined,
            undefined,
            undefined,
            group
        );

        expect(customLanguageConfigurations.de.groups.testGroup).toBe('Altes Label');
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

        const editedLabel: I18N.String = {
            de: 'Test-Feld'
        };

        const editedDescription: I18N.String = {
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


    it('Remove translations equal to default translation from custom language configurations for category', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                categories: {
                    testCategory: {
                        label: 'Altes Label',
                        description: 'Alte Beschreibung'
                    }
                }
            }
        };

        const editedLabel: I18N.String = {
            de: 'Test-Kategorie'
        };

        const editedDescription: I18N.String = {
            de: 'Beschreibungstext der Kategorie'
        };

        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            customLanguageConfigurations,
            editedLabel,
            editedDescription,
            category
        );

        expect(customLanguageConfigurations.de).toBeUndefined();
    });


    it('Remove translations equal to default translation from custom language configurations for group', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                groups: {
                    testGroup: 'Altes Label'
                }
            }
        };

        const editedLabel: I18N.String = {
            de: 'Test-Gruppe'
        };

        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            customLanguageConfigurations,
            editedLabel,
            undefined,
            undefined,
            undefined,
            group
        );

        expect(customLanguageConfigurations.de).toBeUndefined();
    });


    it('Remove all translations from custom language configurations for field', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                categories: {
                    testCategory: {
                        fields: {
                            testField: {
                                label: 'Label 1',
                                description: 'Beschreibung 1'
                            },
                            testField2: {
                                label: 'Label 2',
                                description: 'Beschreibung 2'
                            },
                        }
                    }
                }
            },
            en: {
                categories: {
                    testCategory: {
                        fields: {
                            testField: {
                                label: 'Label',
                                description: 'Description'
                            }
                        }
                    }
                }
            }
        };

        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            customLanguageConfigurations,
            {},
            {},
            category,
            field
        );

        expect(customLanguageConfigurations.de.categories.testCategory.fields.testField)
            .toBeUndefined();
        expect(customLanguageConfigurations.de.categories.testCategory.fields.testField2.label)
            .toBe('Label 2');
        expect(customLanguageConfigurations.de.categories.testCategory.fields.testField2.description)
            .toBe('Beschreibung 2');
        expect(customLanguageConfigurations.en).toBeUndefined();
    });


    it('Remove all translations from custom language configurations for group', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                groups: {
                    testGroup: 'Label 1',
                    testGroup2: 'Label 2'
                }
            },
            en: {
                groups: {
                    testGroup: 'Label'
                }
            }
        };

        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            customLanguageConfigurations,
            {},
            {},
            category,
            undefined,
            group
        );

        expect(customLanguageConfigurations.de.groups.testGroup).toBeUndefined();
        expect(customLanguageConfigurations.de.groups.testGroup2).toBe('Label 2');
        expect(customLanguageConfigurations.en).toBeUndefined();
    });


    it('Remove all translations from custom language configurations for category', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                categories: {
                    testCategory: {
                        fields: {
                            testField: {
                                label: 'Label 1',
                                description: 'Beschreibung 1'
                            }
                        }
                    },
                    testCategory2: {
                        fields: {
                            testField: {
                                label: 'Label 2',
                                description: 'Beschreibung 2'
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
                                label: 'Label',
                                description: 'Description'
                            }
                        }
                    }
                }
            }
        };

        LanguageConfigurationUtil.deleteCategoryFromCustomLanguageConfigurations(
            customLanguageConfigurations,
            category
        );

        expect(customLanguageConfigurations.de.categories.testCategory).toBeUndefined();
        expect(customLanguageConfigurations.de.categories.testCategory2.fields.testField.label)
            .toBe('Label 2');
        expect(customLanguageConfigurations.de.categories.testCategory2.fields.testField.description)
            .toBe('Beschreibung 2');
        expect(customLanguageConfigurations.en).toBeUndefined();
    });
});
