import { Map, to } from 'tsfun';
import { BuiltInFieldDefinition, LanguageConfigurations } from '../../../src/configuration';
import { buildRawProjectConfiguration } from '../../../src/configuration/boot/build-raw-project-configuration';
import { ConfigurationErrors } from '../../../src/configuration/boot/configuration-errors';
import { BuiltInCategoryDefinition } from '../../../src/configuration/model/category/built-in-category-definition';
import { LibraryCategoryDefinition } from '../../../src/configuration/model/category/library-category-definition';
import { CustomFormDefinition } from '../../../src/configuration/model/form/custom-form-definition';
import { LibraryFormDefinition } from '../../../src/configuration/model/form/library-form-definition';
import { CategoryForm } from '../../../src/model/configuration/category-form';
import { Field } from '../../../src/model/configuration/field';
import { Groups } from '../../../src/model/configuration/group';
import { Relation } from '../../../src/model/configuration/relation';
import { Valuelist } from '../../../src/model/configuration/valuelist';
import { RawProjectConfiguration } from '../../../src/services/project-configuration';
import { Tree } from '../../../src/tools/forest';
import { Named } from '../../../src/tools/named';


describe('buildRawProjectConfiguration', () => {

    function buildRawArray(builtInCategories: Map<BuiltInCategoryDefinition>,
                           libraryCategories: Map<LibraryCategoryDefinition>,
                           libraryForms: Map<LibraryFormDefinition>, ...rest: any[]) {

        const raw = buildRawProjectConfiguration(builtInCategories, libraryCategories, libraryForms, ...rest);
        return Tree.flatten<CategoryForm>(raw.forms);
    }


    function buildRaw(builtInCategories: Map<BuiltInCategoryDefinition>,
                      libraryCategories: Map<LibraryCategoryDefinition>,
                      libraryForms: Map<LibraryFormDefinition>, ...rest: any[]) {

        return Named.arrayToMap(buildRawArray(builtInCategories, libraryCategories, libraryForms, ...rest));
    }


    it('throw away unselected forms',  () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {},
                minimalForm: {
                    groups: []
                }
            },
            C: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:default': {
                categoryName: 'A',
                description: {},
                valuelists: {},
                createdBy: '',
                creationDate: '',
                groups: []
            }
        }

        const customForms: Map<CustomFormDefinition> = {
            A: {
                fields: {},
                hidden: []
            },
            B: {
                parent: 'A',
                fields: {},
                hidden: []
            }
        };
        const result = buildRaw(
            builtInCategories,
            {},
            libraryForms,
            customForms
        );

        expect(result['A']).toBeDefined();
        expect(result['B']).toBeDefined();
        expect(result['C']).toBeUndefined();
        expect(result['A:default']).toBeUndefined();
    });


    it('do not throw away any forms if no custom forms are provided',  () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            },
            B: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {},
                minimalForm: {
                    groups: []
                }
            },
            C: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            B1: {
                parent: 'B',
                fields: {},
                description: {}
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:default': {
                categoryName: 'A',
                description: {},
                valuelists: {},
                createdBy: '',
                creationDate: '',
                groups: []
            }
        };

        const result = buildRawArray(
            builtInCategories,
            libraryCategories,
            libraryForms,
            undefined, {}, {}, {}, {}, [], undefined, [], [], undefined,
            ['B']
        );

        expect(result.length).toBe(5);
        expect(result.find(category => category.libraryId === 'A')).toBeDefined();
        expect(result.find(category => category.libraryId === 'A:default')).toBeDefined();
        expect(result.find(category => category.libraryId === 'B')).toBeDefined();
        expect(result.find(category => category.libraryId === 'B1')).toBeDefined();
        expect(result.find(category => category.libraryId === 'C')).toBeDefined();
    });


    it('hide fields', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {
                    field1: { inputType: 'input' },
                    field2: { inputType: 'input' }
                },
                minimalForm: {
                    groups: [{ name: Groups.STEM, fields: ['field1', 'field2'] }]
                }
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            A: {
                fields: {
                    field3: { inputType: 'input' },
                    field4: { inputType: 'input' }
                },
                description: {}
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:default': {
                categoryName: 'A',
                valuelists: {},
                groups: [{
                    name: Groups.STEM,
                    fields: ['field1', 'field2', 'field3', 'field4', 'aCommonField', 'bCommonField']
                }],
                creationDate: '',
                createdBy: '',
                description: {}
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A:default': {
                fields: {},
                hidden: ['field1', 'aCommonField', 'field3']
            }
        };
        
        const commonFields: Map<BuiltInFieldDefinition> = {
            aCommonField: { inputType: 'input' },
            bCommonField: { inputType: 'input' }
        };

        const result = buildRaw(
            builtInCategories,
            libraryCategories,
            libraryForms,
            customForms,
            commonFields
        );

        expect(result['A'].groups[0].fields[0].visible).toBe(false);
        expect(result['A'].groups[0].fields[1].visible).toBe(true);
        expect(result['A'].groups[0].fields[2].visible).toBe(false);
        expect(result['A'].groups[0].fields[3].visible).toBe(true);
        expect(result['A'].groups[0].fields[4].visible).toBe(false);
        expect(result['A'].groups[0].fields[5].visible).toBe(true);
    });


    it('valuelistId - provided via valuelistId property in built-in category', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {
                    aField: {
                        inputType: 'dropdown',
                        valuelistId: 'aField-valuelist-id-1'
                    }
                },
                minimalForm: {
                    groups: [{ name: Groups.STEM, fields: ['aField'] }]
                }
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A': {
                fields: {}
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            {},
            customForms,
            {},
            {
                'aField-valuelist-id-1': {
                    values: { a: {} }, description: {}, createdBy: '', creationDate: ''
                }
            }
        );

        expect(result['A'].groups[0].fields[0]['valuelist']['values']).toEqual({ a: {} });
    });


    it('valuelistId - overwrite valuelists property in custom form, extending a library form - for a common field', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:default': {
                categoryName: 'A',
                groups: [{ name: Groups.STEM, fields: ['aCommon'] }],
                creationDate: '',
                createdBy: '',
                description: {}
            }
        };

        const commonFields: Map<BuiltInFieldDefinition> = {
            aCommon: {
                inputType: 'dropdown',
                valuelistId: 'aCommon-valuelist-id-1'
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A:default': {
                valuelists: { aCommon: 'aCommon-valuelist-id-2' },
                fields: {}
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            libraryForms,
            customForms,
            commonFields,
            {
                'aCommon-valuelist-id-1': {
                    values: { a: {} }, description: {}, createdBy: '', creationDate: ''
                },
                'aCommon-valuelist-id-2': {
                    values: { b: {} }, description: {}, createdBy: '', creationDate: ''
                }
            }
        );

        expect(result['A'].groups[0].fields[0]['valuelist']['values']).toEqual({ b: {} });
    });


    it('valuelistId - overwrite valuelistId in library form', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {
                    aField: {
                        inputType: 'dropdown',
                        valuelistId: 'aField-valuelist-id-1'
                    }
                },
                minimalForm: {
                    groups: [{ name: Groups.STEM, fields: ['aField'] }]
                }
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:default': {
                categoryName: 'A',
                groups: [{ name: Groups.STEM, fields: ['aField'] }],
                valuelists: { aField: 'aField-valuelist-id-2' },
                description: {},
                createdBy: '',
                creationDate: ''
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A:default': {
                fields: {}
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            libraryForms,
            customForms,
            {},
            {
                'aField-valuelist-id-1': {
                    values: { a: {}}, description: {}, creationDate: '', createdBy: ''
                },
                'aField-valuelist-id-2': {
                    values: { b: {}}, description: {}, creationDate: '', createdBy: ''
                }
            }
        );

        expect(result['A'].groups[0].fields[0]['valuelist']['values']).toEqual({ b: {} });
    });


    it('valuelistId - nowhere provided - minimal form selected', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {
                    aField: { inputType: 'dropdown' }
                },
                minimalForm: {
                    groups: [{ name: Groups.STEM, fields: ['aField'] }]
                }
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A': {
                fields: {}
            }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                {},
                {},
                customForms,
                {},
                {},
                {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                [ConfigurationErrors.NO_VALUELIST_PROVIDED, 'A', 'aField']
            ]);
        }
    });


    it('valuelistId - nowhere provided - library form selected', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {
                    aField: { inputType: 'dropdown' }
                },
                minimalForm: {
                    groups: []
                }
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:0': {
                categoryName: 'A',
                valuelists: {},
                groups: [{ name: Groups.STEM, fields: ['aField'] }],
                createdBy: '',
                creationDate: '',
                description: {}
            },
        };

        const customForms: Map<CustomFormDefinition> = {
            'A:0': {
                fields: {}
            }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                {},
                libraryForms,
                customForms,
                {},
                {},
                {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                [ConfigurationErrors.NO_VALUELIST_PROVIDED, 'A', 'aField']
            ]);
        }
    });


    it('valuelistId - nowhere provided - custom form selected', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            A: {
                fields: {
                    aField: { inputType: 'dropdown' }
                }
            }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                {},
                {},
                customForms,
                {},
                {},
                {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                [ConfigurationErrors.NO_VALUELIST_PROVIDED, 'A', 'aField']
            ]);
        }
    });


    it('use a valuelist from custom configuration', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {
                    a1: {
                        inputType: 'dropdown',
                        valuelistId: 'a1-library'
                    }
                },
                minimalForm: {
                    groups: []
                }
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:default': {
                categoryName: 'A',
                groups: [{ name: Groups.STEM, fields: ['a1'] }],
                creationDate: '',
                createdBy: '',
                description: {}
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A:default': {
                valuelists: { a1: 'a1-custom' },
                fields: {}
            }
        };

        const libraryValuelists: Map<Valuelist> = {
            'a1-library': {
                values: { a: {} }, description: {}, createdBy: '', creationDate: ''
            }
        };

        const customValuelists: Map<Valuelist> = {
            'a1-custom': {
                values: { b: {} }, description: {}, createdBy: '', creationDate: ''
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            libraryForms,
            customForms,
            {},
            libraryValuelists,
            customValuelists
        );

        expect(result['A'].groups[0].fields[0]['valuelist']['values']).toEqual({ b: {} });
        expect(result['A'].groups[0].fields[0]['valuelist']['source']).toBe('custom');
    });


    it('prevent overwriting library valuelist in custom configuration', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {
                    a1: {
                        inputType: 'dropdown',
                        valuelistId: 'a1-library'
                    }
                },
                minimalForm: {
                    groups: []
                }
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:default': {
                categoryName: 'A',
                groups: [{ name: Groups.STEM, fields: ['a1'] }],
                creationDate: '',
                createdBy: '',
                description: {}
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A:default': {
                valuelists: {},
                fields: {}
            }
        };

        const libraryValuelists: Map<Valuelist> = {
            'a1-library': {
                values: { a: {} }, description: {}, createdBy: '', creationDate: ''
            }
        };

        const customValuelists: Map<Valuelist> = {
            'a1-library': {
                values: { b: {} }, description: {}, createdBy: '', creationDate: ''
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            libraryForms,
            customForms,
            {},
            libraryValuelists,
            customValuelists
        );

        expect(result['A'].groups[0].fields[0]['valuelist']['values']).toEqual({ a: {} });
        expect(result['A'].groups[0].fields[0]['valuelist']['source']).toBe('library');
    });


    it('inherit custom valuelist from parent form', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {
                    a1: {
                        inputType: 'dropdown',
                        valuelistId: 'a1-library'
                    }
                },
                minimalForm: {
                    groups: [
                        { name: Groups.STEM, fields: ['a1'] }
                    ]
                }
            },
            B: {
                parent: 'A',
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            A: {
                valuelists: { a1: 'a1-custom' },
                fields: {}
            },
            B: {
                fields: {}
            },
            C: {
                parent: 'A',
                fields: {},
                groups: [
                    { name: Groups.STEM, fields: ['a1'] }
                ]
            },
            D: {
                parent: 'A',
                valuelists: { a1: 'a1-custom-2' },  // Ignore this (overwriting valuelists from parent is not allowed)
                fields: {},
                groups: [
                    { name: Groups.STEM, fields: ['a1'] }
                ]
            }
        };

        const libraryValuelists: Map<Valuelist> = {
            'a1-library': {
                values: { a: {} }, description: {}, createdBy: '', creationDate: ''
            }
        };

        const customValuelists: Map<Valuelist> = {
            'a1-custom': {
                values: { b: {} }, description: {}, createdBy: '', creationDate: ''
            },
            'a1-custom-2': {
                values: { c: {} }, description: {}, createdBy: '', creationDate: ''
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            {},
            customForms,
            {},
            libraryValuelists,
            customValuelists
        );

        expect(result['A'].groups[0].fields[0]['valuelist']['values']).toEqual({ b: {} });
        expect(result['A'].groups[0].fields[0]['valuelist']['source']).toBe('custom');

        expect(result['B'].groups[0].fields[0]['valuelist']['values']).toEqual({ b: {} });
        expect(result['B'].groups[0].fields[0]['valuelist']['source']).toBe('custom');

        expect(result['C'].groups[0].fields[0]['valuelist']['values']).toEqual({ b: {} });
        expect(result['C'].groups[0].fields[0]['valuelist']['source']).toBe('custom');

        expect(result['D'].groups[0].fields[0]['valuelist']['values']).toEqual({ b: {} });
        expect(result['D'].groups[0].fields[0]['valuelist']['source']).toBe('custom');
    });


    it('extend valuelist', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                supercategory: true,
                fields: {
                    a1: {
                        inputType: 'dropdown',
                        valuelistId: 'a1-library'
                    }
                },
                minimalForm: {
                    groups: [
                        { name: Groups.STEM, fields: ['a1'] }
                    ]
                }
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            A: {
                valuelists: { a1: 'a1-custom' },
                fields: {}
            }
        };

        const libraryValuelists: Map<Valuelist> = {
            'a1-library': {
                values: { a: {}, b: {} },
                description: {},
                createdBy: '',
                creationDate: ''
            }
        };

        const customValuelists: Map<Valuelist> = {
            'a1-custom': {
                extendedValuelist: 'a1-library',
                values: { c: {} },
                hidden: ['b'],
                description: {},
                createdBy: '',
                creationDate: ''
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            {},
            customForms,
            {},
            libraryValuelists,
            customValuelists
        );

        expect(result['A'].groups[0].fields[0]['valuelist']['values']).toEqual({ a: {}, c: {} });
        expect(result['A'].groups[0].fields[0]['valuelist']['source']).toBe('custom');
    });


    it('duplication in selection - two library forms of the same category', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:0': {
                categoryName: 'A',
                valuelists: {},
                groups: [],
                createdBy: '',
                creationDate: '',
                description: {}
            },
            'A:1': {
                categoryName: 'A',
                valuelists: {},
                groups: [],
                createdBy: '',
                creationDate: '',
                description: {}
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A:0': {
                fields: {}
            },
            'A:1': {
                fields: {}
            }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                {},
                libraryForms,
                customForms
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([[ConfigurationErrors.DUPLICATION_IN_SELECTION, 'A']]);
        }
    });


    it('duplication in selection - minimal form and library form of the same category', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:0': {
                categoryName: 'A',
                groups: [],
                valuelists: {},
                createdBy: '',
                creationDate: '',
                description: {}
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A': { fields: {} },
            'A:0': { fields: {} }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                {},
                libraryForms,
                customForms
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([[ConfigurationErrors.DUPLICATION_IN_SELECTION, 'A']]);
        }
    });


    it('subcategories - library subcategory not allowed', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            B: {
                parent: 'A',
                fields: {},
                description: {}
            }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                libraryCategories,
                {},
                {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                ConfigurationErrors.TRYING_TO_SUBTYPE_A_NON_EXTENDABLE_CATEGORY, 'A'
            ]);
        }
    });


    it('subcategories - custom subcategory not allowed', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            B: {
                parent: 'A',
                fields: {}
            }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                {},
                {},
                customForms
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                ConfigurationErrors.TRYING_TO_SUBTYPE_A_NON_EXTENDABLE_CATEGORY, 'A'
            ]);
        }
    });


    it('ignore attempts to overwrite fields in library', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {
                    aField: { inputType: 'input' }
                },
                minimalForm: {
                    groups: [{ name: Groups.STEM, fields: ['aField', 'aCommon'] }]
                }
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            A: {
                fields: {
                    aField: { inputType: 'boolean' },
                    aCommon: { inputType: 'boolean' }
                },
                description: {}
            }
        };

        const commonFields: Map<BuiltInFieldDefinition> = {
            aCommon: { inputType: 'text' }
        };

        const customForms: Map<CustomFormDefinition> = {
            A: {
                fields: {}
            }
        };

        const result = buildRaw(
            builtInCategories,
            libraryCategories,
            {},
            customForms,
            commonFields
        );

        expect(result['A'].groups[0].fields[0].inputType).toBe('input');
        expect(result['A'].groups[0].fields[1].inputType).toBe('text');
    });


    it('allow overwriting inputType & constraintIndexed in custom forms', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {
                    aField: { inputType: 'input', constraintIndexed: true }
                },
                minimalForm: {
                    groups: [{ name: Groups.STEM, fields: ['aField', 'aCommon'] }]
                }
            },
            B: {
                parent: 'A',
                fields: {},
                minimalForm: {
                    groups: [{ name: Groups.STEM, fields: ['aField', 'aCommon'] }]
                }
            }
        };

        const commonFields: Map<BuiltInFieldDefinition> = {
            aCommon: { inputType: 'text', constraintIndexed: false }
        };

        const customForms: Map<CustomFormDefinition> = {
            A: {
                fields: {
                    aField: { inputType: 'boolean', constraintIndexed: false },
                    aCommon: { inputType: 'boolean', constraintIndexed: true }
                }
            },
            B: {
                fields: {}
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            {},
            customForms,
            commonFields
        );

        expect(result['A'].groups[0].fields[0].inputType).toBe('boolean');
        expect(result['A'].groups[0].fields[0].constraintIndexed).toBe(false);
        expect(result['A'].groups[0].fields[1].inputType).toBe('boolean');
        expect(result['A'].groups[0].fields[1].constraintIndexed).toBe(true);

        expect(result['B'].groups[0].fields[0].inputType).toBe('boolean');
        expect(result['B'].groups[0].fields[0].constraintIndexed).toBe(false);
        expect(result['B'].groups[0].fields[1].inputType).toBe('boolean');
        expect(result['B'].groups[0].fields[1].constraintIndexed).toBe(true);
    });


    it('throw error if field not found', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            A: {
                fields: {},
                groups: [{ name: Groups.STEM, fields: ['missing'] }]
            }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                {},
                {},
                customForms
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([[ConfigurationErrors.FIELD_NOT_FOUND, 'A', 'missing']]);
        }
    });


    it('commons - select common field in library form', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const commonFields: Map<BuiltInFieldDefinition> = {
            aCommon: { inputType: 'input' }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:default': {
                categoryName: 'A',
                groups: [{ name: Groups.STEM, fields: ['aCommon'] }],
                valuelists: {},
                createdBy: '',
                creationDate: '',
                description: {}
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A:default': {
                fields: {}
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            libraryForms,
            customForms,
            commonFields
        );

        expect(result['A'].groups[0].fields[0]['inputType']).toBe('input');
    });


    it('commons - select common field in custom form', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const commonFields: Map<BuiltInFieldDefinition> = {
            aCommon: { inputType: 'input' }
        };

        const customForms: Map<CustomFormDefinition> = {
            A: {
                fields: {},
                groups: [{ name: Groups.STEM, fields: ['aCommon'] }]
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            {},
            customForms,
            commonFields
        );

        expect(result['A'].groups[0].fields[0]['inputType']).toBe('input');
    });


    it('commons - use valuelistFromProjectField if defined in commons', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const commonFields: Map<BuiltInFieldDefinition> = {
            aCommon: { inputType: 'dropdown', valuelistFromProjectField: 'x' }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:0': {
                categoryName: 'A',
                groups: [{ name: Groups.STEM, fields: ['aCommon'] }],
                valuelists: {},
                createdBy: '',
                creationDate: '',
                description: {}
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A:0': {
                fields: {}
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            libraryForms,
            customForms,
            commonFields
        );

        expect(result['A'].groups[0].fields[0]['inputType']).toBe('dropdown');
        expect(result['A'].groups[0].fields[0]['valuelistFromProjectField']).toBe('x');
    });


    // err cases

    it('field property validation - invalid input type', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            A: {
                fields: {
                    aField: { inputType: 'invalid' }
                },
                description: {}
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:default': {
                categoryName: 'A',
                groups: [{ name: Groups.STEM, fields: ['aField'] }],
                description: {},
                createdBy: '',
                creationDate: ''
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A:default': {
                fields: {}
            }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                libraryCategories,
                libraryForms,
                customForms
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                ConfigurationErrors.ILLEGAL_FIELD_INPUT_TYPE, 'invalid', 'aField'
            ]);
        }
    });


    it('field property validation - missing input type in field of library category', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            B: {
                parent: 'A',
                fields: {
                    bField: {}
                },
                description: {}
            },
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                libraryCategories,
                {}, {}, {}, {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                [ConfigurationErrors.MISSING_FIELD_PROPERTY, 'inputType', 'B', 'bField']
            ]);
        }
    });


    it('field property validation - illegal property in library category field', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            A: {
                fields: { aField: { xyz: 'a' } } as any,
                description: {}
            },
        };

        try {
            buildRawProjectConfiguration(builtInCategories,
                libraryCategories,
                {}, {}, {}, {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                ConfigurationErrors.ILLEGAL_FIELD_PROPERTY, 'library', 'xyz'
            ]);
        }
    });


    it('field property validation - illegal property in custom form field', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A': {
                fields: { aField: { xyz: 'a' } as any }
            }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                {},
                {},
                customForms,
                {}, {}, {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                ConfigurationErrors.ILLEGAL_FIELD_PROPERTY, 'custom', 'xyz'
            ]);
        }
    });


    it('apply valuelists configuration', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {
                    field1: {
                        inputType: 'dropdown',
                        valuelistId: '123'
                    }
                },
                minimalForm: {
                    groups: []
                }
            }
        };
        
        const libraryForms: Map<LibraryFormDefinition> = {
            'A:default': {
                categoryName: 'A',
                groups: [
                    { name: Groups.STEM, fields: ['field1'] }
                ],
                creationDate: '',
                createdBy: '',
                description: {}
            }
        };

        const valuelistsConfiguration: Map<Valuelist> = {
            '123': {
                values: {
                    'one': { label: { de: 'Eins', en: 'One' } },
                    'two': { references: ['https://xyz.de/1234567'] },
                    'three': {}
                },
                id: '123',
                description: {},
                createdBy: '',
                creationDate: ''
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A:default': {
                fields: {}
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            libraryForms,
            customForms,
            {},
            valuelistsConfiguration
        );

        expect(result['A'].groups[0].fields[0].valuelist.values).toEqual({
            one: { label: { de: 'Eins', en: 'One' } },
            two: { references: ['https://xyz.de/1234567'] },
            three: {}
        });
    });


    it('no minimal form provided', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                supercategory: true,
                userDefinedSubcategoriesAllowed: true
            }
        } as any;

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            B: {
                parent: 'A',
                fields: {},
                description: {}
            }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                libraryCategories,
                {}, {}, {}, {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([[
                ConfigurationErrors.NO_MINIMAL_FORM_PROVIDED, 'A'
            ]]);
        }
    });


    it('missing description in library category', () => {

        const builtInCategories = {};

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            A: {
                fields: {}
            }
        } as any;

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                libraryCategories,
                {}, {}, {}, {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'description', 'A'
            ]);
        }
    });


    it('missing description in library form', () => {

        const builtInCategories = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            A: {
                fields: {},
                description: {}
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:default': {
                categoryName: 'A',
                createdBy: '',
                creationDate: '',
                groups: [],
                valuelists: {}
            } as any
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                libraryCategories,
                libraryForms,
                {}, {}, {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                ConfigurationErrors.MISSING_FORM_PROPERTY, 'description', 'A:default'
            ]);
        }
    });


    it('missing parent in library category', () => {

        const builtInCategories = {} as any;

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'B': {
                fields: {},
                description: {},
                minimalForm: {
                    groups: []
                } as any
            }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                libraryCategories,
                {}, {}, {}, {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'parent', 'B']);
        }
    });


    it('missing parent in custom form', () => {

        const customForms: Map<CustomFormDefinition> = {
            'A': { fields: {} }
        };

        try {
            buildRawProjectConfiguration(
                {},
                {},
                {},
                customForms,
                {},
                {},
                {}
            );
        } catch (expected) {
            expect(expected).toEqual([
                ConfigurationErrors.MISSING_FORM_PROPERTY, 'parent', 'A', 'must be set for new categories'
            ]);
        }
    });


    it('merge library category with built-in category', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {
                    field1: { inputType: 'text' }
                },
                minimalForm: {
                    groups: []
                }
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A': {
                fields: {
                    field1: { inputType: 'dropdown' },  // Ignore this field
                    field2: { inputType: 'text' }
                },
                minimalForm: {
                    groups: [
                        { name: Groups.STEM, fields: ['field1'] },
                        { name: Groups.PROPERTIES, fields: ['field2'] }
                    ]
                } as any,
                description: {}
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A': { hidden: [], fields: {} }
        }

        const result = buildRaw(
            builtInCategories,
            libraryCategories,
            {},
            customForms
        );

        expect(result['A'].groups[0].fields[0].inputType).toBe('text');
        expect(result['A'].groups[0].name).toBe(Groups.STEM);
        expect(result['A'].groups[1].fields[0].inputType).toBe('text');
        expect(result['A'].groups[1].name).toBe(Groups.PROPERTIES);
    });


    it('merge custom forms with built-in categories', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {
                    field1: { inputType: 'text' }
                },
                minimalForm: {
                    groups: [
                        { name: Groups.STEM, fields: ['field1']}
                    ]
                }
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            A: {
                fields: {
                    field1: { inputType: 'input' },
                    field2: { inputType: 'text' }
                },
                groups: [
                    { name: Groups.STEM, fields: ['field1', 'field2']}
                ]
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            {},
            customForms
        );

        expect(result['A'].groups[0].fields[0].inputType).toBe('input');
        expect(result['A'].groups[0].fields[1].inputType).toBe('text');
    });


    it('merge custom forms with library forms', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {
                    field1: { inputType: 'text' },
                    field2: { inputType: 'text' }
                },
                minimalForm: {
                    groups: [
                        { name: Groups.STEM, fields: ['field1'] }
                    ]
                }
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:default': {
                categoryName: 'A',
                valuelists: {},
                groups: [
                    { name: Groups.STEM, fields: ['field1'] },
                    { name: Groups.PROPERTIES, fields: ['field2'] }
                ],
                creationDate: '',
                createdBy: '',
                description: {}
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A:default': {
                fields: {
                    field2: { inputType: 'input' },
                    field3: { inputType: 'text' }
                },
                groups: [
                    { name: Groups.STEM, fields: ['field1'] },
                    { name: Groups.PROPERTIES, fields: ['field2', 'field3'] }
                ],
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            libraryForms,
            customForms
        );

        expect(result['A'].groups[0].fields[0].inputType).toBe('text');
        expect(result['A'].groups[0].name).toBe(Groups.STEM);
        expect(result['A'].groups[1].fields[0].inputType).toBe('input');
        expect(result['A'].groups[1].fields[1].inputType).toBe('text');
        expect(result['A'].groups[1].name).toBe(Groups.PROPERTIES);
    });


    it('add all fields from library form even if not selected in custom form group', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {
                    field1: { inputType: 'text' },
                    field2: { inputType: 'boolean' }
                },
                minimalForm: {
                    groups: [
                        { name: Groups.STEM, fields: ['field1'] }
                    ]
                }
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:default': {
                categoryName: 'A',
                valuelists: {},
                groups: [
                    { name: Groups.STEM, fields: ['field1', 'field2'] }
                ],
                creationDate: '',
                createdBy: '',
                description: {}
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A:default': {
                fields: {},
                groups: [
                    { name: Groups.STEM, fields: ['field1'] }
                ],
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            libraryForms,
            customForms
        );

        expect(result['A'].groups[0].fields[0].inputType).toBe('text');
        expect(result['A'].groups[1].fields[0].inputType).toBe('boolean');
        expect(result['A'].groups[0].name).toBe(Groups.STEM);
    });


    it('set source field', () => {

        const commonFields: Map<BuiltInFieldDefinition> = {
            aCommon: { inputType: Field.InputType.INPUT }
        };

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {
                    field1: { inputType: Field.InputType.TEXT }
                },
                minimalForm: {
                    groups: [
                        { name: Groups.STEM, fields: ['field1'] }
                    ]   
                }
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A': {
                fields: {
                    field2: { inputType: Field.InputType.TEXT }
                },
                description: {}
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:default': {
                categoryName: 'A',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                description: {},
                groups: [
                    { name: Groups.STEM, fields: ['field1'] }
                ]
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A:default': {
                fields: {
                    field3: { inputType: Field.InputType.TEXT }
                },
                groups: [
                    { name: Groups.STEM, fields: ['field1'] },
                    { name: Groups.PROPERTIES, fields: ['aCommon', 'field2', 'field3'] },
                ]
            }
        };

        const result = buildRaw(
            builtInCategories,
            libraryCategories,
            libraryForms,
            customForms,
            commonFields
        );

        expect(result['A'].groups[0].fields[0].source).toBe(Field.Source.BUILTIN);
        expect(result['A'].groups[0].name).toBe(Groups.STEM);
        expect(result['A'].groups[1].fields[0].source).toBe(Field.Source.COMMON);
        expect(result['A'].groups[1].fields[1].source).toBe(Field.Source.LIBRARY);
        expect(result['A'].groups[1].fields[2].source).toBe(Field.Source.CUSTOM);
        expect(result['A'].groups[1].name).toBe(Groups.PROPERTIES);
    });


   it('set group labels', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {
                    field1: { inputType: Field.InputType.TEXT },
                    field2: { inputType: Field.InputType.TEXT },
                    field3: { inputType: Field.InputType.TEXT }
                },
                minimalForm: {
                    groups: [
                        { name: Groups.STEM, fields: ['field1', 'field2'] },
                        { name: Groups.PROPERTIES, fields: ['field3'] }
                    ]
                }
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            B: {
                parent: 'A',
                fields: {
                    field4: { inputType: Field.InputType.TEXT },
                },
                minimalForm: {
                    groups: [
                        { name: Groups.STEM, fields: ['field1', 'field2'] },
                        { name: Groups.PROPERTIES, fields: ['field3', 'field4'] }
                    ]
                } as any,
                description: {}
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            A: {
                fields: {}
            },
            B: {
                fields: {}
            }
        };

        const languageConfigurations = {
            complete: {
                de: [{
                    groups: {
                        'stem': 'Stem',
                        'properties': 'Eigenschaften'
                    },
                    categories: {
                        A: { label: 'A_' },
                        B: { label: 'B_' }
                    }
                }]
            },
            default: {}
        };

        const result = buildRaw(
            builtInCategories,
            libraryCategories,
            {},
            customForms,
            {}, {}, {}, {}, [],
            languageConfigurations
        );

        expect(result['A'].groups[0].label.de).toEqual('Stem');
        expect(result['A'].groups[1].label.de).toEqual('Eigenschaften');

        expect(result['B'].groups[0].label.de).toEqual('Stem');
        expect(result['B'].groups[1].label.de).toEqual('Eigenschaften');
    });


    it('apply categories order', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            B: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            },
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            },
            C: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            B: { fields: {} },
            A: { fields: {} },
            C: { fields: {} }
        };

        const orderConfiguration = ['C', 'A'];

        const result = buildRawArray(
            builtInCategories,
            {},
            {},
            customForms,
            {}, {}, {}, {}, [],
            { default: {}, complete: {} },
            [],
            orderConfiguration
        ).map(Named.toName);

        expect(result).toEqual(['C', 'A', 'B']);
    });


    it('apply categories order to children', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            B: {
                parent: 'D',
                fields: {},
                minimalForm: {
                    groups: []
                }
            },
            A: {
                parent: 'D',
                fields: {},
                minimalForm: {
                    groups: []
                }
            },
            C: {
                parent: 'D',
                fields: {},
                minimalForm: {
                    groups: []
                }
            },
            D: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            },
        };

        const customForms: Map<CustomFormDefinition> = {
            B: { fields: {} },
            A: { fields: {} },
            C: { fields: {} },
            D: { fields: {} }
        };

        const orderConfiguration = ['C', 'A'];

        const result = buildRaw(
            builtInCategories,
            {},
            {},
            customForms,
            {}, {}, {}, {}, [],
            { default: {}, complete: {} },
            [],
            orderConfiguration
        )['D'].children.map(to(Named.NAME));

        expect(result).toEqual(['C', 'A', 'B']);
    });


    it('put relations into groups', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            P: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {},
                minimalForm: {
                    groups: [
                        { name: Groups.POSITION, fields: ['isAbove'] }
                    ]
                }
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            P: {
                fields: {}
            },
            C: {
                parent: 'P',
                fields: {},
                groups: [
                    { name: Groups.POSITION, fields: ['isAbove'] }
                ]
            }
        };

        const relationDefinitions: Array<Relation> = [{
            name: 'isAbove',
            inverse: 'isBelow',
            domain: ['P:inherit'],
            range: ['P:inherit'],
            inputType: 'relation',
            sameMainCategoryResource: true
        }];

        const result = buildRaw(
            builtInCategories,
            {},
            {},
            customForms,
            {}, {}, {}, {},
            relationDefinitions
        );

        const parentGroup = result['P'].groups[0];
        const childGroup = result['P'].children[0].groups[0];

        expect(parentGroup.name).toEqual(Groups.POSITION);
        expect(parentGroup.fields[0].name).toEqual('isAbove');
        expect(childGroup.name).toEqual(Groups.POSITION);
        expect(childGroup.fields[0].name).toEqual('isAbove');
    });


    it('link parent and child instances', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            P: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {},
                minimalForm: {
                    groups: []
                }
            },
        };

        const customForms: Map<CustomFormDefinition> = {
            P: {
                fields: {}
            },
            C: {
                parent: 'P',
                fields: {}
            }
        };

        const categoryFormsTree = buildRawProjectConfiguration(
            builtInCategories,
            {},
            {},
            customForms
        ).forms;


        expect((Tree.access(categoryFormsTree, 0) as any).children[0].name).toBe('C');
        expect((Tree.access(categoryFormsTree, 0, 0) as any).name).toBe('C');
        expect((Tree.access(categoryFormsTree, 0) as any).children[0]
            === Tree.access(categoryFormsTree, 0, 0)).toBeTruthy();

        expect((Tree.access(categoryFormsTree, 0) as any).name).toBe('P');
        expect((Tree.access(categoryFormsTree, 0, 0) as any).parentCategory.name).toBe('P');
        expect((Tree.access(categoryFormsTree, 0, 0) as any).parentCategory
            === Tree.access(categoryFormsTree, 0)).toBeTruthy();
    });


    it('allow overwriting color', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                color: 'blue',
                fields: {},
                minimalForm: {
                    groups: []
                }
            },
            B: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:default': {
                categoryName: 'A',
                valuelists: {},
                groups: [],
                creationDate: '',
                createdBy: '',
                description: {}
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A:default': {
                fields: {},
                color: 'red'
            },
            B: {
                fields: {},
                color: 'red'
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            libraryForms,
            customForms
        );

        expect(result['A'].color).toBe('red');
        expect(result['A'].defaultColor).toBe('blue');
        expect(result['B'].color).toBe('red');
        expect(result['B'].defaultColor).toBe('#000042');   // Auto-generated color
    });


   it('return categories, common fields and relations with correct labels', () => {

        const commonFields: Map<BuiltInFieldDefinition> = {
            aCommon: { inputType: Field.InputType.TEXT }
        };

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {
                    field1: { inputType: Field.InputType.TEXT }
                },
                minimalForm: {
                    groups: [
                        { name: Groups.STEM, fields: ['field1'] }
                    ]   
                }
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A': {
                fields: {
                    field2: { inputType: Field.InputType.TEXT }
                },
                description: {}
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:default': {
                categoryName: 'A',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                description: {},
                groups: [
                    { name: Groups.STEM, fields: ['field1'] }
                ]
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A:default': {
                fields: {
                    field3: { inputType: Field.InputType.TEXT }
                },
                groups: [
                    { name: Groups.STEM, fields: ['field1'] },
                    { name: Groups.PROPERTIES, fields: ['aCommon', 'field2', 'field3'] },
                ]
            }
        };

        const relationDefinitions: Array<Relation> = [{
            name: 'isRelated',
            domain: ['A'],
            range: ['A'],
            inputType: 'relation'
        }];

        const languageConfigurations: LanguageConfigurations = {
            complete: {
                en: [{
                    categories: {
                        A: {
                            label: 'Custom category label',
                            fields: {
                                field1: { label: 'Field 1 Custom' },
                                field2: { label: 'Field 2' },
                                field3: { label: 'Field 3' },
                                aCommon: { label: 'Custom common field label' }
                            }
                        }
                    },
                    commons: {
                        aCommon: { label: 'Common field A' }
                    },
                    relations: {
                        isRelated: { label: 'Custom relation label' }
                    }
                }]
            },
            default: {
                en: [{
                    categories: {
                        A: {
                            label: 'Default category label',
                            fields: {
                                field1: { label: 'Field 1 Default' },
                                field2: { label: 'Field 2' }
                            }
                        }
                    },
                    commons: {
                        aCommon: { label: 'Common field A' }
                    },
                    relations: {
                        isRelated: { label: 'Default relation label' }
                    }
                }]
            }
        };

        const rawConfiguration: RawProjectConfiguration = buildRawProjectConfiguration(
            builtInCategories,
            libraryCategories,
            libraryForms,
            customForms,
            commonFields,
            {},
            {},
            {},
            relationDefinitions,
            languageConfigurations
        );

        const forms: Map<CategoryForm> = Named.arrayToMap(Tree.flatten<CategoryForm>(rawConfiguration.forms));

        expect(rawConfiguration.commonFields['aCommon'].label.en).toBe('Common field A');
        expect(rawConfiguration.commonFields['aCommon'].defaultLabel.en).toBe('Common field A');

        expect(rawConfiguration.categories['A'].label.en).toBe('Custom category label');
        expect(rawConfiguration.categories['A'].defaultLabel.en).toBe('Default category label');
        expect(rawConfiguration.categories['A'].fields['field1'].label.en).toBe('Field 1 Custom');
        expect(rawConfiguration.categories['A'].fields['field1'].defaultLabel.en).toBe('Field 1 Default');
        expect(rawConfiguration.categories['A'].fields['field2'].label.en).toBe('Field 2');
        expect(rawConfiguration.categories['A'].fields['field2'].defaultLabel.en).toBe('Field 2');
        expect(rawConfiguration.categories['A'].fields['field3']).toBe(undefined);

        expect(rawConfiguration.relations[0].label.en).toBe('Custom relation label');
        expect(rawConfiguration.relations[0].defaultLabel.en).toBe('Default relation label');

        expect(forms['A'].label.en).toBe('Custom category label');
        expect(forms['A'].defaultLabel.en).toBe('Default category label');
        expect(forms['A'].groups[0].fields[0].label.en).toBe('Field 1 Custom');
        expect(forms['A'].groups[0].fields[0].defaultLabel.en).toBe('Field 1 Default');
        expect(forms['A'].groups[1].fields[0].label.en).toBe('Custom common field label');
        expect(forms['A'].groups[1].fields[0].defaultLabel.en).toBe('Common field A');
        expect(forms['A'].groups[1].fields[1].label.en).toBe('Field 2');
        expect(forms['A'].groups[1].fields[1].defaultLabel.en).toBe('Field 2');
        expect(forms['A'].groups[1].fields[2].label.en).toBe('Field 3');
        expect(forms['A'].groups[1].fields[2].defaultLabel.en).toBe(undefined);
    });


    it('allow changing constraintIndexed via custom form', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {
                    field1: { inputType: 'input', constraintIndexed: false },
                    field2: { inputType: 'input', constraintIndexed: true }
                },
                minimalForm: {
                    groups: []
                }
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            A: {
                fields: {}
            },
            C: {
                parent: 'A',
                fields: {
                    field1: { constraintIndexed: true },
                    field2: { constraintIndexed: false }
                },
                groups: [{ name: Groups.STEM, fields: ['field1', 'field2'] }]
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            {},
            customForms
        );

        expect(result['C'].groups[0].fields[0].name).toEqual('field1');
        expect(result['C'].groups[0].fields[0].constraintIndexed).toBe(true);
        expect(result['C'].groups[0].fields[0].defaultConstraintIndexed).toBe(false);

        expect(result['C'].groups[0].fields[1].name).toEqual('field2');
        expect(result['C'].groups[0].fields[1].constraintIndexed).toBe(false);
        expect(result['C'].groups[0].fields[1].defaultConstraintIndexed).toBe(true);
    });


    it('allow setting identifier prefix', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'A:default': {
                categoryName: 'A',
                valuelists: {},
                groups: [],
                creationDate: '',
                createdBy: '',
                description: {}
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A:default': {
                fields: {},
                color: 'red',
                identifierPrefix: 'A-'
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            libraryForms,
            customForms
        );

        expect(result['A'].identifierPrefix).toBe('A-');
    });
});
