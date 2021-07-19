import { Category } from 'idai-field-core';
import { ConfigurationUtil } from '../../../../src/app/core/configuration/configuration-util';


/**
 * @author Thomas Kleinke
 */
 describe('ConfigurationUtil', () => {

    const category: Category = {
        name: 'TestCategory',
        categoryName: 'TestCategory',
        label: {},
        defaultLabel: {},
        description: {},
        defaultDescription: {},
        children: [],
        parentCategory: undefined,
        isAbstract: false,
        groups: [],
        mustLieWithin: false,
        color: '#fff'
    };


    it('Check if catagory is customized', () => {

        expect(ConfigurationUtil.isCustomizedCategory({
            resource: {
                categories: {
                    TestCategory: {
                        fields: {},
                        hidden: []
                    }
                },
                languages: {}
            }
        } as any, category)).toBe(false);

        expect(ConfigurationUtil.isCustomizedCategory({
            resource: {
                categories: {
                    TestCategory: {
                        fields: {},
                        hidden: [],
                        color: '#fff'
                    }
                },
                languages: {}
            }
        } as any, category)).toBe(true);

        expect(ConfigurationUtil.isCustomizedCategory({
            resource: {
                categories: {
                    TestCategory: {
                        fields: {},
                        hidden: ['field1']
                    }
                },
                languages: {}
            }
        } as any, category)).toBe(true);

        expect(ConfigurationUtil.isCustomizedCategory({
            resource: {
                categories: {
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

        expect(ConfigurationUtil.isCustomizedCategory({
            resource: {
                categories: {
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

        expect(ConfigurationUtil.isCustomizedCategory({
            resource: {
                categories: {
                    TestCategory: {
                        fields: {},
                        hidden: [],
                        commons: ['supervisor']
                    }
                },
                languages: {}
            }
        } as any, category)).toBe(true);

        expect(ConfigurationUtil.isCustomizedCategory({
            resource: {
                categories: {
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
