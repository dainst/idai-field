import { ConfigurationResource } from '../../src/model/configuration-resource';


/**
 * @author Thomas Kleinke
 */
 describe('ConfigurationResource', () => {

    it('Get differing forms', () => {

        const resource1: ConfigurationResource = {
            id: 'configuration',
            identifier: 'Configuration',
            category: 'Configuration',
            forms: {
                'Trench:default': {
                    fields: {
                        field1: { inputType: 'text' }
                    }
                },
                'Find:default': {
                    fields: {
                        field1: { inputType: 'text' }
                    }
                }
            },
            languages: {},
            projectLanguages: [],
            valuelists: {},
            order: [],
            relations: {}
        };

        const resource2: ConfigurationResource = {
            id: 'configuration',
            identifier: 'Configuration',
            category: 'Configuration',
            forms: {
                'Trench:default': {
                    fields: {
                        field1: { inputType: 'boolean' }
                    }
                },
                'Find:default': {
                    fields: {
                        field1: { inputType: 'text' }
                    }
                },
                'Image:default': {
                    fields: {}
                }
            },
            languages: {},
            projectLanguages: [],
            valuelists: {},
            order: [],
            relations: {}
        };

        expect(ConfigurationResource.getDifferingForms(resource1, resource2))
            .toEqual(['Trench:default', 'Image:default']);
    });


    it('Get differing language configurations', () => {

        const resource1: ConfigurationResource = {
            id: 'configuration',
            identifier: 'Configuration',
            category: 'Configuration',
            forms: {},
            languages: {
                de: {
                    categories: {
                        Trench: {
                            fields: { field1: { label: 'Feld 1' } }
                        }
                    }
                },
                en: {
                    categories: {
                        Trench: {
                            fields: { field1: { label: 'Field 1' } }
                        }
                    }
                }
            },
            projectLanguages: [],
            valuelists: {},
            order: [],
            relations: {}
        };

        const resource2: ConfigurationResource = {
            id: 'configuration',
            identifier: 'Configuration',
            category: 'Configuration',
            forms: {},
            languages: {
                de: {
                    categories: {
                        Trench: {
                            fields: { field1: { label: 'Feld A' } }
                        }
                    }
                },
                en: {
                    categories: {
                        Trench: {
                            fields: { field1: { label: 'Field 1' } }
                        }
                    }
                },
                it: {
                    categories: {
                        Trench: {
                            label: 'Saggio'
                        }
                    }
                }
            },
            projectLanguages: [],
            valuelists: {},
            order: [],
            relations: {}
        };

        expect(ConfigurationResource.getDifferingLanguages(resource1, resource2))
            .toEqual(['de', 'it']);
    });


    it('Get differing valuelists', () => {

        const resource1: ConfigurationResource = {
            id: 'configuration',
            identifier: 'Configuration',
            category: 'Configuration',
            forms: {},
            languages: {},
            projectLanguages: [],
            valuelists: {
                'valuelist-1': {
                    values: { value1: {} }
                },
                'valuelist-2': {
                    values: { value1: {} }
                }
            },
            order: [],
            relations: {}
        };

        const resource2: ConfigurationResource = {
            id: 'configuration',
            identifier: 'Configuration',
            category: 'Configuration',
            forms: {},
            languages: {},
            projectLanguages: [],
            valuelists: {
                'valuelist-1': {
                    values: { value1: {}, value2: {} }
                },
                'valuelist-2': {
                    values: { value1: {} }
                },
                'valuelist-3': {
                    values: { value1: {} }
                }
            },
            order: [],
            relations: {}
        };

        expect(ConfigurationResource.getDifferingValuelists(resource1, resource2))
            .toEqual(['valuelist-1', 'valuelist-3']);
    });
});
