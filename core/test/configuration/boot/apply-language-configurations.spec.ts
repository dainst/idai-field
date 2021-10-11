import { Map } from 'tsfun';
import { LanguageConfigurations } from '../../../src/configuration/model/language/language-configurations';
import { applyLanguageConfigurations } from '../../../src/configuration/boot/apply-language-configurations';
import { TransientFormDefinition } from '../../../src/configuration/model/form/transient-form-definition';
import { Relation } from '../../../src/model/configuration/relation';
import { TransientCategoryDefinition } from '../../../src/configuration/model/category/transient-category-definition';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('applyLanguageConfigurations', () => {

    let configuration: [Map<TransientFormDefinition>, Array<Relation>];


    it('apply language', () => {

        configuration = [
            {
                A: { categoryName: 'A', fields: { a: {}, a1: {} } } as any,
                B: { categoryName: 'B', fields: { b: {} } } as any
            },
            [
                { name: 'isRecordedIn' } as Relation,
                { name: 'isContemporaryWith' } as Relation
            ]
        ];
        
        const categories: Map<TransientCategoryDefinition> = {
            A: { fields: { a: {}, a1: {} } } as any,
            B: { fields: { b: {} } } as any
        }

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

        const [forms, relations] = applyLanguageConfigurations(languageConfigurations, categories)(configuration);

        expect(forms['A'].label.en).toEqual('A_');
        expect(forms['B'].label).toEqual({});
        expect(forms['A'].fields['a'].label.en).toEqual('a_');
        expect(forms['A'].fields['a1'].label.en).toBeUndefined();
        expect(forms['A'].fields['a'].description).toEqual({});
        expect(forms['A'].fields['a1'].description.en).toEqual('a1_desc');
        expect(relations[0].label.en).toEqual('isRecordedIn_');
        expect(relations[1].label).toEqual({});
    });


    it('apply multiple language configurations', () => {

        configuration = [
            {
                A: { categoryName: 'A', fields: { a: {} } } as any,
                B: { categoryName: 'B', fields: { b: {} } } as any
            },
            [
                { name: 'isRecordedIn' } as Relation
            ]
        ];

        const categories: Map<TransientCategoryDefinition> = {
            A: { fields: { a: {} } } as any,
            B: { fields: { b: {} } } as any
        };

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

        const [forms, relations] = applyLanguageConfigurations(languageConfigurations, categories)(configuration);

        expect(forms['A'].label.de).toEqual('A Deutsch');
        expect(forms['A'].label.en).toEqual('A Englisch');
        expect(forms['A'].label.es).toBeUndefined();
        expect(forms['B'].label.de).toEqual('B Deutsch');
        expect(forms['B'].label.en).toEqual('B Englisch');
        expect(forms['B'].label.es).toBeUndefined();

        expect(forms['A'].fields['a'].label.de).toEqual('a Deutsches Label');
        expect(forms['A'].fields['a'].label.en).toEqual('a Englisches Label');
        expect(forms['A'].fields['a'].label.es).toEqual('a Spanisches Label');
        expect(forms['A'].fields['a'].description.de).toEqual('a Deutsche Beschreibung');
        expect(forms['A'].fields['a'].description.en).toEqual('a Englische Beschreibung');
        expect(forms['A'].fields['a'].description.es).toEqual('a Spanische Beschreibung');
        expect(forms['B'].fields['b'].label.de).toBeUndefined();
        expect(forms['B'].fields['b'].label.en).toEqual('b Englisches Label');
        expect(forms['B'].fields['b'].label.es).toBeUndefined();
        expect(forms['B'].fields['b'].description.de).toBeUndefined();
        expect(forms['B'].fields['b'].description.en).toEqual('b Englische Beschreibung');
        expect(forms['B'].fields['b'].description.es).toBeUndefined();

        expect(relations[0].label.de).toEqual('Liegt in (Deutsch)');
        expect(relations[0].label.en).toEqual('Liegt in (Englisch)');
    });


    it('apply default and custom language configurations', () => {

        configuration = [
            {
                A: { categoryName: 'A', fields: { a: {} } } as any,
                B: { categoryName: 'B', fields: { b: {} } } as any,
                C: { categoryName: 'C', fields: { c: {} } } as any
            },
            [
                { name: 'isRecordedIn' } as Relation
            ]
        ];

        const categories: Map<TransientCategoryDefinition> = {
            A: { fields: { a: {} } } as any,
            B: { fields: { b: {} } } as any,
            C: { fields: { c: {} } } as any
        };

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

        const [forms, relations] = applyLanguageConfigurations(languageConfigurations, categories)(configuration);

        expect(forms['A'].label.de).toEqual('A Custom');
        expect(forms['A'].defaultLabel.de).toEqual('A Library');
        expect(forms['B'].label.de).toEqual('B Core');
        expect(forms['B'].defaultLabel.de).toEqual('B Core');
        expect(forms['C'].label.de).toEqual('C Custom');
        expect(forms['C'].defaultLabel).toEqual({});
        
        expect(forms['A'].fields['a'].label.de).toEqual('a Label Custom');
        expect(forms['A'].fields['a'].defaultLabel.de).toEqual('a Label Library');
        expect(forms['A'].fields['a'].description.de).toEqual('a Beschreibung Custom');
        expect(forms['A'].fields['a'].defaultDescription.de).toEqual('a Beschreibung Library');
        expect(forms['B'].fields['b'].label.de).toEqual('b Label Core');
        expect(forms['B'].fields['b'].defaultLabel.de).toEqual('b Label Core');
        expect(forms['B'].fields['b'].description.de).toEqual('b Beschreibung Core');
        expect(forms['B'].fields['b'].defaultDescription.de).toEqual('b Beschreibung Core');
        expect(forms['C'].fields['c'].label.de).toEqual('c Label Custom');
        expect(forms['C'].fields['c'].defaultLabel).toEqual({});
        expect(forms['C'].fields['c'].description.de).toEqual('c Beschreibung Custom');
        expect(forms['C'].fields['c'].defaultDescription).toEqual({});
        
        expect(relations[0].label.de).toEqual('Liegt in (Custom)');
        expect(relations[0].defaultLabel.de).toEqual('Liegt in (Library)');
    });
});
