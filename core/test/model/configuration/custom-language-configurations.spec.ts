import { CategoryForm } from '../../../src/model/configuration/category-form';
import { Field } from '../../../src/model/configuration/field';
import { Group } from '../../../src/model/configuration/group';
import { CustomLanguageConfigurations} from '../../../src/model/custom-language-configurations';
import { I18N } from '../../../src/tools/i18n';


/**
 * @author Thomas Kleinke
 */
 describe('CustomLanguageConfigurations', () => {

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

    const category: CategoryForm = {
        name: 'testCategory',
        label: categoryLabel,
        defaultLabel: categoryLabel,
        categoryLabel: categoryLabel,
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

    const compositeField: Field = {
        name: 'testCompositeField',
        subfields: [
            {
                name: 'testSubfield',
                label: fieldLabel,
                defaultLabel: fieldLabel,
                description: fieldDescription,
                defaultDescription: fieldDescription,
                inputType: 'text'
            }
        ],
        inputType: 'composite'
    };

    const relation: Field = {
        name: 'testRelation',
        label: fieldLabel,
        defaultLabel: fieldLabel,
        description: fieldDescription,
        defaultDescription: fieldDescription,
        inputType: 'relation'
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


        CustomLanguageConfigurations.update(
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


    it('Add new translations to custom language configurations for subfield', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                categories: {
                    testCategory: {
                        fields: {
                            testCompositeField: {
                                subfields: {
                                    testSubfield: {
                                        label: 'Altes Label',
                                        description: 'Alte Beschreibung'
                                    }
                                }
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


        CustomLanguageConfigurations.update(
            customLanguageConfigurations,
            editedLabel,
            editedDescription,
            category,
            compositeField,
            compositeField.subfields[0]
        );

        expect(customLanguageConfigurations.de.categories.testCategory.fields.testCompositeField.subfields.testSubfield
            .label).toBe('Neues Label');
        expect(customLanguageConfigurations.de.categories.testCategory.fields.testCompositeField.subfields.testSubfield
            .description).toBe('Neue Beschreibung');
        expect(customLanguageConfigurations.en.categories.testCategory.fields.testCompositeField.subfields.testSubfield
            .label).toBe('New label');
        expect(customLanguageConfigurations.en.categories.testCategory.fields.testCompositeField.subfields.testSubfield
            .description).toBe('New description');
    });


    it('Add new translations to custom language configurations for relation', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                relations: {
                    testRelation: {
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


        CustomLanguageConfigurations.update(
            customLanguageConfigurations,
            editedLabel,
            editedDescription,
            category,
            relation
        );

        expect(customLanguageConfigurations.de.relations.testRelation.label).toBe('Neues Label');
        expect(customLanguageConfigurations.de.relations.testRelation.description).toBe('Neue Beschreibung');
        expect(customLanguageConfigurations.en.relations.testRelation.label).toBe('New label');
        expect(customLanguageConfigurations.en.relations.testRelation.description).toBe('New description');
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


        CustomLanguageConfigurations.update(
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


        CustomLanguageConfigurations.update(
            customLanguageConfigurations,
            editedLabel,
            undefined,
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

        CustomLanguageConfigurations.update(
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


    it('Remove deleted translations from custom language configurations for subfield', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                categories: {
                    testCategory: {
                        fields: {
                            testCompositeField: {
                                subfields: {
                                    testSubfield: {
                                        label: 'Altes Label',
                                        description: 'Alte Beschreibung'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            en: {
                categories: {
                    testCategory: {
                        fields: {
                            testCompositeField: {
                                subfields: {
                                    testSubfield: {
                                        label: 'Old label',
                                        description: 'Old description'
                                    }
                                }
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

        CustomLanguageConfigurations.update(
            customLanguageConfigurations,
            editedLabel,
            editedDescription,
            category,
            compositeField,
            compositeField.subfields[0]
        );

        expect(customLanguageConfigurations.de.categories.testCategory.fields.testCompositeField.subfields.testSubfield
            .label).toBe('Altes Label');
        expect(customLanguageConfigurations.de.categories.testCategory.fields.testCompositeField.subfields.testSubfield
            .description).toBeUndefined();
        expect(customLanguageConfigurations.en).toBeUndefined();
    });


    it('Remove deleted translations from custom language configurations for relation', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                relations: {
                    testRelation: {
                        label: 'Altes Label',
                        description: 'Alte Beschreibung'
                    }
                }
            },
            en: {
                relations: {
                    testRelation: {
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

        CustomLanguageConfigurations.update(
            customLanguageConfigurations,
            editedLabel,
            editedDescription,
            category,
            relation
        );

        expect(customLanguageConfigurations.de.relations.testRelation.label).toBe('Altes Label');
        expect(customLanguageConfigurations.de.relations.testRelation.description).toBeUndefined();
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

        CustomLanguageConfigurations.update(
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

        CustomLanguageConfigurations.update(
            customLanguageConfigurations,
            editedLabel,
            undefined,
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

        CustomLanguageConfigurations.update(
            customLanguageConfigurations,
            editedLabel,
            editedDescription,
            category,
            field
        );

        expect(customLanguageConfigurations.de).toBeUndefined();
    });


    it('Remove translations equal to default translation from custom language configurations for subfield', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                categories: {
                    testCategory: {
                        fields: {
                            testCompositeField: {
                                subfields: {
                                    testSubfield: {
                                        label: 'Altes Label',
                                        description: 'Alte Beschreibung'
                                    }
                                }
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

        CustomLanguageConfigurations.update(
            customLanguageConfigurations,
            editedLabel,
            editedDescription,
            category,
            compositeField,
            compositeField.subfields[0]
        );

        expect(customLanguageConfigurations.de).toBeUndefined();
    });


    it('Remove translations equal to default translation from custom language configurations for relation', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                relations: {
                    testRelation: {
                        label: 'Altes Label',
                        description: 'Alte Beschreibung'
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

        CustomLanguageConfigurations.update(
            customLanguageConfigurations,
            editedLabel,
            editedDescription,
            category,
            relation
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

        CustomLanguageConfigurations.update(
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

        CustomLanguageConfigurations.update(
            customLanguageConfigurations,
            editedLabel,
            undefined,
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

        CustomLanguageConfigurations.update(
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


    it('Remove all translations from custom language configurations for subfield', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                categories: {
                    testCategory: {
                        fields: {
                            testCompositeField: {
                                subfields: {
                                    testSubfield: {
                                        label: 'Label 1',
                                        description: 'Beschreibung 1'
                                    }
                                }
                            },
                            testCompositeField2: {
                                subfields: {
                                    testSubfield2: {
                                        label: 'Label 2',
                                        description: 'Beschreibung 2'
                                    }
                                }
                            },
                        }
                    }
                }
            },
            en: {
                categories: {
                    testCategory: {
                        fields: {
                            testCompositeField: {
                                subfields: {
                                    testSubfield: {
                                        label: 'Label',
                                        description: 'Description'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        CustomLanguageConfigurations.update(
            customLanguageConfigurations,
            {},
            {},
            category,
            compositeField,
            compositeField.subfields[0]
        );

        expect(customLanguageConfigurations.de.categories.testCategory.fields.testCompositeField).toBeUndefined();
        expect(customLanguageConfigurations.de.categories.testCategory.fields.testCompositeField2.subfields.testSubfield2
            .label).toBe('Label 2');
        expect(customLanguageConfigurations.de.categories.testCategory.fields.testCompositeField2.subfields.testSubfield2
            .description).toBe('Beschreibung 2');
        expect(customLanguageConfigurations.en).toBeUndefined();
    });


    it('Remove all translations from custom language configurations for relation', () => {

        const customLanguageConfigurations: CustomLanguageConfigurations = {
            de: {
                relations: {
                    testRelation: {
                        label: 'Label 1',
                        description: 'Beschreibung 1'
                    },
                    testRelation2: {
                        label: 'Label 2',
                        description: 'Beschreibung 2'
                    },
                }
            },
            en: {
                relations: {
                    testRelation: {
                        label: 'Label',
                        description: 'Description'
                    }
                }
            }
        };

        CustomLanguageConfigurations.update(
            customLanguageConfigurations,
            {},
            {},
            category,
            relation
        );

        expect(customLanguageConfigurations.de.relations.testRelation).toBeUndefined();
        expect(customLanguageConfigurations.de.relations.testRelation2.label).toBe('Label 2');
        expect(customLanguageConfigurations.de.relations.testRelation2.description).toBe('Beschreibung 2');
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

        CustomLanguageConfigurations.update(
            customLanguageConfigurations,
            {},
            {},
            category,
            undefined,
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

        CustomLanguageConfigurations.deleteCategory(
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
