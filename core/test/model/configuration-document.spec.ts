import { ConfigurationDocument } from '../../src/model/configuration-document';
import { CategoryForm } from '../../src/model/configuration/category-form';


/**
 * @author Thomas Kleinke
 */
 describe('ConfigurationDocument', () => {

    const category: CategoryForm = {
        name: 'TestCategory',
        label: {},
        defaultLabel: {},
        categoryLabel: {},
        description: {},
        defaultDescription: {},
        children: [],
        parentCategory: undefined,
        isAbstract: false,
        groups: [],
        mustLieWithin: false,
        color: '#fff'
    };


    it('Check if category is customized', () => {

        expect(ConfigurationDocument.isCustomizedCategory({
            resource: {
                forms: {
                    TestCategory: {
                        fields: {},
                        hidden: []
                    }
                },
                languages: {}
            }
        } as any, category)).toBe(false);

        expect(ConfigurationDocument.isCustomizedCategory({
            resource: {
                forms: {
                    TestCategory: {
                        fields: {},
                        hidden: [],
                        color: '#fff'
                    }
                },
                languages: {}
            }
        } as any, category)).toBe(true);

        expect(ConfigurationDocument.isCustomizedCategory({
            resource: {
                forms: {
                    TestCategory: {
                        fields: {},
                        hidden: ['field1']
                    }
                },
                languages: {}
            }
        } as any, category)).toBe(true);

        expect(ConfigurationDocument.isCustomizedCategory({
            resource: {
                forms: {
                    TestCategory: {
                        fields: {
                            field1: {
                                inputType: 'text'
                            }
                        },
                        hidden: []
                    }
                },
                languages: {}
            }
        } as any, category)).toBe(true);

        expect(ConfigurationDocument.isCustomizedCategory({
            resource: {
                forms: {
                    TestCategory: {
                        fields: {},
                        hidden: [],
                        valuelists: {
                            field1: 'valuelist-field1'
                        }
                    }
                },
                languages: {}
            }
        } as any, category)).toBe(true);

        expect(ConfigurationDocument.isCustomizedCategory({
            resource: {
                forms: {
                    TestCategory: {
                        fields: {},
                        hidden: []
                    }
                },
                languages: {
                    de: {
                        categories: {
                            TestCategory: {
                                label: 'Test'
                            }
                        }
                    }
                }
            }
        } as any, category)).toBe(true);
    });
});
