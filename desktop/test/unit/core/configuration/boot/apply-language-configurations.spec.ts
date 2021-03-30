import {Map} from 'tsfun';
import {CategoryDefinition} from 'idai-field-core';
import {LibraryCategoryDefinition} from '../../../../../src/app/core/configuration/model/library-category-definition';
import {applyLanguageConfigurations} from '../../../../../src/app/core/configuration/boot/apply-language-configurations';


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

        const languageConfigurations = [{
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
        }];

        const [categories,relations] = applyLanguageConfigurations(languageConfigurations)(configuration);

        expect(categories['A'].label).toEqual('A_');
        expect(categories['B'].label).toBeUndefined();
        expect(categories['A'].fields['a'].label).toEqual('a_');
        expect(categories['A'].fields['a1'].label).toBeUndefined();
        expect(categories['A'].fields['a'].description).toBeUndefined();
        expect(categories['A'].fields['a1'].description).toEqual('a1_desc');
        expect(relations[0].label).toEqual('isRecordedIn_');
        expect(relations[1].label).toBeUndefined();
    });


    it('apply multiple language configurations', () => {

        configuration = [
            {
                A: { fields: { a: {} } } as CategoryDefinition,
                B: { fields: { b: {} } } as CategoryDefinition
            },
            [{ name: 'isRecordedIn' }]
        ];

        const languageConfigurations = [{
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
        }, {
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
        }, {
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
        }];

        const [categories,relations] = applyLanguageConfigurations(languageConfigurations)(configuration);

        expect(categories['A'].label).toEqual('A Deutsch');
        expect(categories['B'].label).toEqual('B Deutsch');
        expect(categories['A'].fields['a'].label).toEqual('a Spanisches Label');
        expect(categories['A'].fields['a'].description).toEqual('a Spanische Beschreibung');
        expect(categories['B'].fields['b'].label).toEqual('b Englisches Label');
        expect(categories['B'].fields['b'].description).toEqual('b Englische Beschreibung');
        expect(relations[0].label).toEqual('Liegt in (Deutsch)');
    });
});

























