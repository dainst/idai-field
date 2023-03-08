import { Map } from 'tsfun';
import { LanguageConfigurations } from '../../../src/configuration/model/language/language-configurations';
import { Relation } from '../../../src/model/configuration/relation';
import { TransientCategoryDefinition } from '../../../src/configuration/model/category/transient-category-definition';
import { applyLanguagesToCategory, applyLanguagesToForm, applyLanguagesToRelations } from '../../../src/configuration/boot/apply-languages-configurations';
import { TransientFormDefinition } from '../../../src/configuration/model/form/transient-form-definition';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('applyLanguageConfigurations', () => {

    it('apply language configuration', () => {
        
        const categories: Map<TransientCategoryDefinition> = {
            A: { name: 'A', fields: { a: {}, a1: {}, a2: {} } } as any,
            B: { name: 'B', fields: { b: {} } } as any
        };

        const forms: Map<TransientFormDefinition> = {
            'A:form': { name: 'A:form', categoryName: 'A', fields: { a: {}, a1: {}, a2: {} } } as any
        };

        const relations: Array<Relation> = [
            { name: 'isRecordedIn' } as Relation,
            { name: 'isContemporaryWith' } as Relation
        ];

        const languageConfigurations: LanguageConfigurations = {
            complete: {
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
                                },
                                a2: {
                                    label: 'a2_'
                                }
                            }
                        }
                    },
                    forms: {
                        'A:form': {
                            fields: {
                                a: {
                                    label: 'a_form'
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
            },
            default: {}
        };

        applyLanguagesToCategory(languageConfigurations, categories['A']);
        applyLanguagesToCategory(languageConfigurations, categories['B']);
        applyLanguagesToForm(languageConfigurations, forms['A:form']);
        applyLanguagesToRelations(languageConfigurations, relations);

        expect(categories['A'].label.en).toEqual('A_');
        expect(categories['B'].label).toEqual({});
        expect(categories['A'].fields['a'].label.en).toEqual('a_');
        expect(categories['A'].fields['a1'].label.en).toBeUndefined();
        expect(categories['A'].fields['a'].description).toEqual({});
        expect(categories['A'].fields['a1'].description.en).toEqual('a1_desc');
        expect(forms['A:form'].fields['a'].label.en).toEqual('a_form');
        expect(forms['A:form'].fields['a1'].label.en).toBeUndefined();
        expect(forms['A:form'].fields['a2'].label.en).toEqual('a2_');
        expect(relations[0].label.en).toEqual('isRecordedIn_');
        expect(relations[1].label).toEqual({});
    });


    it('apply multiple language configurations', () => {

        const categories: Map<TransientCategoryDefinition> = {
            A: { name: 'A', fields: { a: {} } } as any,
            B: { name: 'B', fields: { b: {} } } as any
        };

        const relations: Array<Relation> = [
            { name: 'isRecordedIn' } as Relation
        ];

        const languageConfigurations: LanguageConfigurations = {
            complete: {
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
            },
            default: {}
        };

        applyLanguagesToCategory(languageConfigurations, categories['A']);
        applyLanguagesToCategory(languageConfigurations, categories['B']);
        applyLanguagesToRelations(languageConfigurations, relations);

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


    it('apply default and custom language configurations', () => {

        const categories: Map<TransientCategoryDefinition> = {
            A: { name: 'A', fields: { a: {} } } as any,
            B: { name: 'B', fields: { b: {} } } as any,
            C: { name: 'C', fields: { c: {} } } as any
        };

        const relations: Array<Relation> = [
            { name: 'isRecordedIn' } as Relation
        ];

        const libraryConfiguration = {
            categories: {
                A: {
                    label: 'A Library',
                    fields: {
                        a: {
                            label: 'a Label Library',
                            description: 'a Beschreibung Library'
                        }
                    }
                }
            },
            relations: {
                isRecordedIn: {
                    label: 'Liegt in (Library)'
                }
            }
        };

        const coreConfiguration = {
            categories: {
                A: {
                    label: 'A Core',
                    fields: {
                        a: {
                            label: 'a Label Core',
                            description: 'a Beschreibung Core'
                        }
                    }
                },
                B: {
                    label: 'B Core',
                    fields: {
                        b: {
                            label: 'b Label Core',
                            description: 'b Beschreibung Core'
                        }
                    }
                }
            },
            relations: {
                isRecordedIn: {
                    label: 'Liegt in (Core)'
                }
            }
        };
        
        const customConfiguration = {
            categories: {
                A: {
                    label: 'A Custom',
                    fields: {
                        a: {
                            label: 'a Label Custom',
                            description: 'a Beschreibung Custom'
                        }
                    }
                },
                C: {
                    label: 'C Custom',
                    fields: {
                        c: {
                            label: 'c Label Custom',
                            description: 'c Beschreibung Custom'
                        }
                    }
                },
            },
            relations: {
                isRecordedIn: {
                    label: 'Liegt in (Custom)'
                }
            }
        };

        const languageConfigurations: LanguageConfigurations = {
            default: {
                de: [libraryConfiguration, coreConfiguration]
            },
            complete: {
                de: [customConfiguration, libraryConfiguration, coreConfiguration]
            }
        };

        applyLanguagesToCategory(languageConfigurations, categories['A']);
        applyLanguagesToCategory(languageConfigurations, categories['B']);
        applyLanguagesToCategory(languageConfigurations, categories['C']);
        applyLanguagesToRelations(languageConfigurations, relations);

        expect(categories['A'].label.de).toEqual('A Custom');
        expect(categories['A'].defaultLabel.de).toEqual('A Library');
        expect(categories['B'].label.de).toEqual('B Core');
        expect(categories['B'].defaultLabel.de).toEqual('B Core');
        expect(categories['C'].label.de).toEqual('C Custom');
        expect(categories['C'].defaultLabel).toEqual({});
        
        expect(categories['A'].fields['a'].label.de).toEqual('a Label Custom');
        expect(categories['A'].fields['a'].defaultLabel.de).toEqual('a Label Library');
        expect(categories['A'].fields['a'].description.de).toEqual('a Beschreibung Custom');
        expect(categories['A'].fields['a'].defaultDescription.de).toEqual('a Beschreibung Library');
        expect(categories['B'].fields['b'].label.de).toEqual('b Label Core');
        expect(categories['B'].fields['b'].defaultLabel.de).toEqual('b Label Core');
        expect(categories['B'].fields['b'].description.de).toEqual('b Beschreibung Core');
        expect(categories['B'].fields['b'].defaultDescription.de).toEqual('b Beschreibung Core');
        expect(categories['C'].fields['c'].label.de).toEqual('c Label Custom');
        expect(categories['C'].fields['c'].defaultLabel).toEqual({});
        expect(categories['C'].fields['c'].description.de).toEqual('c Beschreibung Custom');
        expect(categories['C'].fields['c'].defaultDescription).toEqual({});
        
        expect(relations[0].label.de).toEqual('Liegt in (Custom)');
        expect(relations[0].defaultLabel.de).toEqual('Liegt in (Library)');
    });
});
