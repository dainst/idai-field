import { Category } from 'idai-field-core';
import { ConfigurationUtil } from '../../../../src/app/components/configuration/configuration-util';


/**
 * @author Thomas Kleinke
 */
 describe('ConfigurationUtil', () => {

    const category: Category = {
        name: 'TestCategory',
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


    it('Check if category is customized', () => {

        expect(ConfigurationUtil.isCustomizedCategory({
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

        expect(ConfigurationUtil.isCustomizedCategory({
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

        expect(ConfigurationUtil.isCustomizedCategory({
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

        expect(ConfigurationUtil.isCustomizedCategory({
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

        expect(ConfigurationUtil.isCustomizedCategory({
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

        expect(ConfigurationUtil.isCustomizedCategory({
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
