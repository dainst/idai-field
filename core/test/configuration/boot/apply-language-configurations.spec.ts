import { Map } from 'tsfun';
import { applyLanguageConfigurations } from '../../../src/configuration/boot';
import { LibraryCategoryDefinition } from '../../../src/configuration/model';
import { CategoryDefinition } from '../../../src/model';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('applyLanguageConfigurations', () => {

    let configuration;
    let t1: LibraryCategoryDefinition;

    beforeEach(() => {

        t1 = {
            categoryName: 'x1',
            commons: [],
            parent: 'x',
            description: { 'de': '' },
            createdBy: '',
            creationDate: '',
            color: 'white',
            valuelists: {},
            fields: {
                'aField': {}
            }
        } as LibraryCategoryDefinition;

        configuration = {
            identifier: 'test',
            categories: {
                'T1': t1
            } as Map<LibraryCategoryDefinition>
        } as any;
    });


    it('apply language', () => {

        configuration = [
            {
                A: { fields: { a: {}, a1: {} } } as CategoryDefinition,
                B: { fields: { b: {} } } as CategoryDefinition
            },
            [{ name: 'isRecordedIn' }, { name: 'isContemporaryWith' }]
        ];

        const languageConfigurations = {
            en: [{
                categories: {
                    A: {
                        label: 'A_',
                        fields: {
                            a: {
                                label: 'a_'
                            },
                            a1: {
                                description: 'a1_desc'
                            }
                        }
                    }
                },
                relations: {
                    isRecordedIn: {
                        label: 'isRecordedIn_'
                    }
                }
            }]
        };

        const [categories, relations] = applyLanguageConfigurations(languageConfigurations)(configuration);

        expect(categories['A'].label.en).toEqual('A_');
        expect(categories['B'].label).toEqual({});
        expect(categories['A'].fields['a'].label.en).toEqual('a_');
        expect(categories['A'].fields['a1'].label.en).toBeUndefined();
        expect(categories['A'].fields['a'].description).toEqual({});
        expect(categories['A'].fields['a1'].description.en).toEqual('a1_desc');
        expect(relations[0].label.en).toEqual('isRecordedIn_');
        expect(relations[1].label).toEqual({});
    });


    it('apply multiple language configurations', () => {

        configuration = [
            {
                A: { fields: { a: {} } } as CategoryDefinition,
                B: { fields: { b: {} } } as CategoryDefinition
            },
            [{ name: 'isRecordedIn' }]
        ];

        const languageConfigurations = {
            es: [{
                categories: {
                    A: {
                        fields: {
                            a: {
                                label: 'a Spanisches Label',
                                description: 'a Spanische Beschreibung'
                            }
                        }
                    }
                }
            }],
            de: [{
                categories: {
                    A: {
                        label: 'A Deutsch',
                        fields: {
                            a: {
                                label: 'a Deutsches Label',
                                description: 'a Deutsche Beschreibung'
                            }
                        }
                    },
                    B: {
                        label: 'B Deutsch'
                    }
                },
                relations: {
                    isRecordedIn: {
                        label: 'Liegt in (Deutsch)'
                    }
                }
            }],
            en: [{
                categories: {
                    A: {
                        label: 'A Englisch',
                        fields: {
                            a: {
                                label: 'a Englisches Label',
                                description: 'a Englische Beschreibung'
                            }
                        }
                    },
                    B: {
                        label: 'B Englisch',
                        fields: {
                            b: {
                                label: 'b Englisches Label',
                                description: 'b Englische Beschreibung'
                            }
                        }
                    }
                },
                relations: {
                    isRecordedIn: {
                        label: 'Liegt in (Englisch)'
                    }
                }
            }]
        };

        const [categories, relations] = applyLanguageConfigurations(languageConfigurations)(configuration);

        expect(categories['A'].label.de).toEqual('A Deutsch');
        expect(categories['A'].label.en).toEqual('A Englisch');
        expect(categories['A'].label.es).toBeUndefined();
        expect(categories['B'].label.de).toEqual('B Deutsch');
        expect(categories['B'].label.en).toEqual('B Englisch');
        expect(categories['B'].label.es).toBeUndefined();
        expect(categories['A'].fields['a'].label.de).toEqual('a Deutsches Label');
        expect(categories['A'].fields['a'].label.en).toEqual('a Englisches Label');
        expect(categories['A'].fields['a'].label.es).toEqual('a Spanisches Label');
        expect(categories['A'].fields['a'].description.de).toEqual('a Deutsche Beschreibung');
        expect(categories['A'].fields['a'].description.en).toEqual('a Englische Beschreibung');
        expect(categories['A'].fields['a'].description.es).toEqual('a Spanische Beschreibung');
        expect(categories['B'].fields['b'].label.de).toBeUndefined();
        expect(categories['B'].fields['b'].label.en).toEqual('b Englisches Label');
        expect(categories['B'].fields['b'].label.es).toBeUndefined();
        expect(categories['B'].fields['b'].description.de).toBeUndefined();
        expect(categories['B'].fields['b'].description.en).toEqual('b Englische Beschreibung');
        expect(categories['B'].fields['b'].description.es).toBeUndefined();
        expect(relations[0].label.de).toEqual('Liegt in (Deutsch)');
        expect(relations[0].label.en).toEqual('Liegt in (Englisch)');
    });
});
