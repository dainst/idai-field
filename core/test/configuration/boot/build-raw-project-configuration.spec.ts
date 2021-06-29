import { Map, left, to } from 'tsfun';
import { buildRawProjectConfiguration, ConfigurationErrors } from '../../../src/configuration/boot';
import { BuiltinCategoryDefinition, CustomCategoryDefinition,
    LibraryCategoryDefinition } from '../../../src/configuration/model';
import { Category, FieldDefinition, Groups, ValuelistDefinition } from '../../../src/model';
import { Named, Tree } from '../../../src/tools';
import InputType = FieldDefinition.InputType;


describe('buildRawProjectConfiguration', () => {

    const categories = left;

    function buildRawArray(a: any, b: any, ...rest: any[]) {

        const raw = buildRawProjectConfiguration(a, b, ...rest);
        return Tree.flatten<Category>(categories(raw));
    }

    function buildRaw(a: any, b: any, ...rest: any[]) {

        return Named.arrayToMap(buildRawArray(a, b, ...rest));
    }


    it('auto-select parent if child defined',  () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {},
                groups: []
            }
        };
        const customCategories: Map<CustomCategoryDefinition> = {
            B: {
                parent: 'A',
                fields: {},
                hidden: []
            }
        };
        const result = buildRaw(
            builtInCategories,
            {},
            customCategories
        );

        expect(result['A']).toBeDefined();
        expect(result['B']).toBeDefined();
    });


    it('throw away category which is neither selected explicitly or as a parent',  () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {},
                groups: []
            },
            C: {
                fields: {},
                groups: []
            }
        };
        const customCategories: Map<CustomCategoryDefinition> = {
            B: {
                parent: 'A',
                fields: {},
                hidden: []
            }
        };
        const result = buildRaw(
            builtInCategories,
            {},
            customCategories
        );

        expect(result['A']).toBeDefined();
        expect(result['B']).toBeDefined();
        expect(result['C']).toBeUndefined();
    });


    it('hide fields', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: {
                fields: {
                    field1: { inputType: 'input' },
                    field2: { inputType: 'input' }
                },
                groups: []
            }
        };
        const libraryCategories: Map<LibraryCategoryDefinition> = {
            A: {
                categoryName: 'A',
                commons: ['aCommonField', 'bCommonField'],
                valuelists: {},
                groups: [],
                fields: {
                    field3: { inputType: 'input' },
                    field4: { inputType: 'input' }
                },
                creationDate: '', createdBy: '', description: {}
            }
        };
        const customCategories = {
            A: {
                fields: {},
                hidden: ['field1', 'aCommonField', 'field3']
            }
        };
        const commonFields = {
            aCommonField: { inputType: 'input' },
            bCommonField: { inputType: 'input' }
        };

        const result = buildRaw(
            builtInCategories,
            libraryCategories,
            customCategories,
            commonFields
        );

        expect(result['A'].groups[0].fields[0].visible).toBe(false);
        expect(result['A'].groups[0].fields[1].visible).toBe(true);
        expect(result['A'].groups[0].fields[2].visible).toBe(false);
        expect(result['A'].groups[0].fields[3].visible).toBe(true);
        expect(result['A'].groups[0].fields[4].visible).toBe(false);
        expect(result['A'].groups[0].fields[5].visible).toBe(true);
    });


    it('valuelistId - provided via valuelists property in custom category', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: { fields: { aField: { inputType: 'dropdown' } }, groups: [] }
        };
        const libraryCategories: Map<LibraryCategoryDefinition> = {};
        const customCategories: Map<CustomCategoryDefinition> = {
            'A': {
                fields: {},
                valuelists: { aField: 'aField-valuelist-id-1' }
            }
        };

        const result = buildRaw(
            builtInCategories,
            libraryCategories,
            customCategories,
            {},
            {
                'aField-valuelist-id-1': {
                    values: { a: {} }, description: {}, createdBy: '', creationDate: ''
                }
            }
        );

        expect(result['A'].groups[0].fields[0]['valuelist']['values']).toEqual({ a: {} });
    });


    it('valuelistId - overwrite valuelists property in custom category, extending a library category - for a common field', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: { fields: {}, groups: [] } };
        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:default': {
                commons: ['aCommon'],
                valuelists: { aCommon: 'aCommon-valuelists-id-1' },
                groups: [],
                creationDate: '', createdBy: '', description: {}, fields: {}, categoryName: 'A'}
        };
        const commonFields = { aCommon: { group: 'stem', inputType: 'dropdown' }};
        const customCategories: Map<CustomCategoryDefinition> = {
            'A:default': {
                commons: ['aCommon'],
                valuelists: { aCommon: 'aCommon-valuelist-id-2' },
                fields: {}
            }
        };

        const result = buildRaw(
            builtInCategories,
            libraryCategories,
            customCategories,
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


    it('valuelistId - provided via valuelists property in library', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: { fields: { aField: { inputType: 'dropdown' } }, groups: [] }
        };
        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:default': {
                valuelists: { aField: 'aField-valuelist-id-1' },
                categoryName: 'A',
                commons: [],
                fields: {},
                groups: [],
                description: {},
                createdBy: '',
                creationDate: ''
            }
        };
        const customCategories: Map<CustomCategoryDefinition> = {
            'A:default': { fields: {} }
        };

        const result = buildRaw(
            builtInCategories,
            libraryCategories,
            customCategories,
            {},
            {
                'aField-valuelist-id-1': {
                    values: { a: {}}, description: {}, creationDate: '', createdBy: ''
                }
            }
        );

        expect(result['A'].groups[0].fields[0]['valuelist']['values']).toEqual({ a: {} });
    });


    it('valuelistId - nowhere provided - built in category selected', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: { fields: { aField: { inputType: 'dropdown' } }, groups: [] }
        };
        const customCategories: Map<CustomCategoryDefinition> = {
            'A': { fields: { aField: {} } }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                {},
                customCategories,
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


    it('valuelistId - nowhere provided - library category selected', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: { fields: { aField: { inputType: 'dropdown' } }, groups: [] }
        };
        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:0': {
                categoryName: 'A',
                commons: [],
                valuelists: {},
                fields: { aField: {} },
                groups: [],
                createdBy: '',
                creationDate: '',
                description: {}
            },
        };
        const customCategories: Map<CustomCategoryDefinition> = {
            'A:0': { fields: { aField: {} } }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                libraryCategories,
                customCategories,
                {},
                {},
                {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                [ConfigurationErrors.NO_VALUELIST_PROVIDED, 'A:0', 'aField']
            ]);
        }
    });


    it('duplication in selection', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = { A: { fields: {}, groups: [] } };
        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:0': {
                categoryName: 'A',
                commons: [],
                valuelists: {},
                fields: {},
                groups: [],
                createdBy: '',
                creationDate: '',
                description: {}
            },
            'A:1': {
                categoryName: 'A',
                commons: [],
                valuelists: {},
                fields: {},
                groups: [],
                createdBy: '',
                creationDate: '',
                description: {}
            }
        };
        const customCategories: Map<CustomCategoryDefinition> = {
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
                libraryCategories,
                customCategories
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([[ConfigurationErrors.DUPLICATION_IN_SELECTION, 'A']]);
        }
    });


    it('duplication in selection - built in categories create category name implicitly', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = { A: { fields: {}, groups: [] } };
        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:0': {
                categoryName: 'A',
                commons: [],
                fields: {},
                groups: [],
                valuelists: {},
                createdBy: '',
                creationDate: '',
                description: {}
            }
        };
        const customCategories: Map<CustomCategoryDefinition> = {
            'A': { fields: {} },
            'A:0': { fields: {} }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                libraryCategories,
                customCategories
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([[ConfigurationErrors.DUPLICATION_IN_SELECTION, 'A']]);
        }
    });


    it('category names - divergent input type', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = { A: { fields: {}, groups: [] } };
        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:0': {
                categoryName: 'A',
                commons: [],
                valuelists: {},
                fields: { aField: { inputType: 'text' } },
                groups: [],
                createdBy: '',
                creationDate: '',
                description: {}
            },
            'A:1': {
                categoryName: 'A',
                commons: [],
                valuelists: {},
                fields: { aField: { inputType: 'input' } },
                groups: [],
                createdBy: '',
                creationDate: '',
                description: {}
            }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                libraryCategories
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                ConfigurationErrors.INCONSISTENT_CATEGORY_NAME,
                'A', 'divergentInputType', 'aField'
            ]);
        }
    });


    it('subcategories - user defined subcategory not allowed', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = { A: { fields: {}, groups: [] } };
        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'B:0': {
                categoryName: 'B',
                parent: 'A',
                fields: {},
                groups: [],
                commons: [],
                createdBy: '',
                valuelists: {},
                creationDate: '',
                description: {}
            }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                libraryCategories,
                { 'B:0': { fields: {}, groups: [] } },
                {},
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


    it('commons - cannot set type of common in library categories', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = { A: { fields: {}, groups: [] } };
        const commonFields = { aCommon: { group: 'stem', inputType: 'input' } };
        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:0': {
                categoryName: 'A',
                commons: [],
                fields: { aCommon: { inputType: 'input' } },
                groups: [],
                createdBy: '',
                valuelists: {},
                creationDate: '',
                description: {}
            }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                libraryCategories,
                { 'A:0': { fields: {}, groups: [] } },
                commonFields,
                {},
                {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                ConfigurationErrors.MUST_NOT_SET_INPUT_TYPE, 'A:0', 'aCommon'
            ]);
        }
    });


    it('commons - cannot set type of common in custom categories', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = { A: { fields: {}, groups: [] } };
        const commonFields = { aCommon: { group: 'stem', inputType: 'input' } };
        const customCategories: Map<CustomCategoryDefinition> = {
            'A': { fields: { aCommon: { inputType: 'text' } }, groups: [] }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                {},
                customCategories,
                commonFields,
                {},
                {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.MUST_NOT_SET_INPUT_TYPE, 'A', 'aCommon']);
        }
    });


    it('commons - common field not provided', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = { A: { fields: {}, groups: [] } };
        const commonFields = {};
        const customCategories: Map<CustomCategoryDefinition> = {
            A: { fields: {}, commons: ['missing']}
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                {},
                customCategories,
                commonFields,
                {},
                {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.COMMON_FIELD_NOT_PROVIDED, 'missing']);
        }
    });


    it('commons - mix in commons in library category', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = { A: { fields: {}, groups: [] } };
        const commonFields = { aCommon: { group: 'stem', inputType: 'input' } };
        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:0': {
                categoryName: 'A',
                commons: ['aCommon'],
                fields: {},
                groups: [],
                valuelists: {},
                createdBy: '',
                creationDate: '',
                description: {}
            }
        };

        const result = buildRaw(
            builtInCategories,
            libraryCategories,
            { 'A:0': { fields: {} } },
            commonFields,
            {},
            {}
        );

        expect(result['A'].groups[0].fields[0]['group']).toBe('stem');
        expect(result['A'].groups[0].fields[0]['inputType']).toBe('input');
    });


    it('commons - mix in commons in custom category', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = { A: { fields: {}, groups: [] } };
        const commonFields = { aCommon: { group: 'stem', inputType: 'input' } };
        const customCategories: Map<CustomCategoryDefinition> = {
            A: {
                commons: ['aCommon'],
                fields: {}
            }
        };

        const result = buildRaw(
            builtInCategories,
            {},
            customCategories,
            commonFields,
            {},
            {}
        );

        expect(result['A'].groups['0'].fields[0]['group']).toBe('stem');
        expect(result['A'].groups['0'].fields[0]['inputType']).toBe('input');
    });


    it('commons - add together commons from library and custom category', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = { A: { fields: {}, groups: [] } };
        const commonFields = {
            aCommon: { group: 'stem', inputType: 'input' },
            bCommon: { group: 'stem', inputType: 'input' }
        };
        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:0': {
                categoryName: 'A',
                commons: ['aCommon'],
                fields: {},
                groups: [],
                valuelists: {},
                createdBy: '',
                creationDate: '',
                description: {}
            }
        };
        const customCategories: Map<CustomCategoryDefinition> = {
            'A:0': {
                commons: ['bCommon'],
                fields: {}
            }
        };

        const result = buildRaw(
            builtInCategories,
            libraryCategories,
            customCategories,
            commonFields,
            {},
            {}
        );

        expect(result['A'].groups[0].fields[0]['group']).toBe('stem');
        expect(result['A'].groups[0].fields[0]['inputType']).toBe('input');
        expect(result['A'].groups[0].fields[1]['group']).toBe('stem');
        expect(result['A'].groups[0].fields[1]['inputType']).toBe('input');
    });


    it('commons - use valuelistFromProjectField if defined in commons', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = { A: { fields: {}, groups: [] } };
        const commonFields = {
            aCommon: { group: 'stem', inputType: 'dropdown', valuelistFromProjectField: 'x' }
        };
        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:0': {
                categoryName: 'A',
                commons: ['aCommon'],
                fields: {},
                groups: [],
                valuelists: {},
                createdBy: '',
                creationDate: '',
                description: {}
            }
        };

        const result = buildRaw(
            builtInCategories,
            libraryCategories,
            { 'A:0': { fields: {} } },
            commonFields,
            {},
            {}
        );

        expect(result['A'].groups[0].fields[0]['group']).toBe('stem');
        expect(result['A'].groups[0].fields[0]['inputType']).toBe('dropdown');
        expect(result['A'].groups[0].fields[0]['valuelistFromProjectField']).toBe('x');
    });


    // err cases

    it('field property validation - invalid input type', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = { A: { fields: {}, groups: [] } };
        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:0': {
                categoryName: 'A',
                commons: [],
                valuelists: {},
                fields: { aField: { inputType: 'invalid' } },
                groups: [],
                createdBy: '',
                creationDate: '',
                description: {}
            }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                libraryCategories,
                {},
                [],
                {},
                {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                ConfigurationErrors.ILLEGAL_FIELD_INPUT_TYPE, 'invalid', 'aField'
            ]);
        }
    });


    it('field property validation - missing input type in field of entirely new custom category', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: { fields: {}, groups: [], supercategory: true, userDefinedSubcategoriesAllowed: true }
        };
        const libraryCategories: Map<LibraryCategoryDefinition> = {};
        const customCategories: Map<CustomCategoryDefinition> = {
            C: { parent: 'A', fields: { cField: {} } }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                libraryCategories,
                customCategories,
                {},
                {},
                {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                [ConfigurationErrors.MISSING_FIELD_PROPERTY, 'inputType', 'C', 'cField']
            ]);
        }
    });


    it('field property validation - missing input name in field of builtInCategory name - extension of supercategory', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: { fields: {}, groups: [] }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:0': {
                categoryName: 'A',
                commons: [],
                valuelists: {},
                fields: { aField: {} } as any,
                groups: [],
                creationDate: '', createdBy: '', description: {}
            },
        };

        try {
            buildRawProjectConfiguration(builtInCategories,
                libraryCategories,
                {},  {}, {}, {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                [ConfigurationErrors.MISSING_FIELD_PROPERTY, 'inputType', 'A:0', 'aField']
            ]);
        }
    });


    it('field property validation  - extension of supercategory - inputType inherited from builtIn', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: { fields: { aField: { inputType: 'input' } }, groups: [] }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:0': {
                categoryName: 'A',
                commons: [],
                valuelists: {},
                fields: { aField: {} } as any,
                groups: [],
                creationDate: '', createdBy: '', description: {}
            },
        };

        const result = buildRaw(
            builtInCategories,
            libraryCategories,
            { 'A:0': { hidden: [], fields: {} } },
            {}, {},
            {}
        );

        expect(result['A'].groups[0].fields[0].inputType).toBe('input');
    });


    it('field property validation - missing input type in field of library category - new subcategory', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: { fields: {}, groups: [], supercategory: true, userDefinedSubcategoriesAllowed: true }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'B:0': {
                categoryName: 'B',
                parent: 'A',
                commons: [],
                valuelists: {},
                fields: { bField: {} } as any,
                groups: [],
                creationDate: '', createdBy: '', description: {}
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
                [ConfigurationErrors.MISSING_FIELD_PROPERTY, 'inputType', 'B:0', 'bField']
            ]);
        }
    });


    it('field property validation - must not set field name on inherited field', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: { fields: { aField: { inputType: 'input' } }, groups: [] }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:0': {
                categoryName: 'A',
                commons: [],
                valuelists: {},
                fields: { aField: { inputType: 'input' } } as any,
                groups: [],
                creationDate: '', createdBy: '', description: {}
            },
        };

        try {
            buildRawProjectConfiguration(builtInCategories,
                libraryCategories,
                {}, {}, {}, {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.MUST_NOT_SET_INPUT_TYPE, 'A:0', 'aField']);
        }
    });


    it('field property validation - undefined property in library category field', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: { fields: {}, groups: [] }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:0': {
                categoryName: 'A',
                commons: [],
                valuelists: {},
                fields: { aField: { group: 'a' } } as any,
                groups: [],
                creationDate: '', createdBy: '', description: {}
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
                ConfigurationErrors.ILLEGAL_FIELD_PROPERTY, 'library', 'group'
            ]);
        }
    });


    it('field property validation - undefined property in custom category field', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: { fields: {}, groups: [] }
        };

        const customCategories: Map<CustomCategoryDefinition> = {
            'A': {
                fields: { aField: { xyz: 'a' } as any }
            }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                {},
                customCategories, {}, {}, {}
            );
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                ConfigurationErrors.ILLEGAL_FIELD_PROPERTY, 'custom', 'xyz'
            ]);
        }
    });


    it('apply valuelistConfiguration', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: {
                fields: {
                    field1: { inputType: 'input' }
                },
                groups: []
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition>  = {
            'A:0': {
                categoryName: 'A',
                commons: [],
                valuelists: { 'a1': '123' },
                fields: {
                    a1: { inputType: 'dropdown' },
                    a2: { inputType: 'input' },
                    a3: { inputType: 'input' }
                },
                groups: [],
                creationDate: '',
                createdBy: '',
                description: {}
            }
        };

        const valuelistsConfiguration: Map<ValuelistDefinition> = {
            '123': {
                values: {
                    'one': { labels: { de: 'Eins', en: 'One' } },
                    'two': { references: { externalId: '1234567' } },
                    'three': {}
                },
                id: '123',
                description: {},
                createdBy: '',
                creationDate: ''
            }
        };

        const result = buildRaw(
            builtInCategories,
            libraryCategories,
            { 'A:0': { fields: {} } }, {}, valuelistsConfiguration, {}
        );

        result['A'].groups['0'].fields.sort(Named.byName);

        expect(result['A'].groups['0'].fields[0].valuelist.values).toEqual({
            one: { labels: { de: 'Eins', en: 'One' } },
            two: { references: { externalId: '1234567' } },
            three: {}
        });
    });


    it('missing description', () => {

        const builtInCategories = {};

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'B:0': {
                fields: {}
            }
        } as any;

        try {
            buildRawProjectConfiguration(builtInCategories,
                libraryCategories,
                {}, {}, {}, {}
            );
        } catch (expected) {
            expect(expected).toEqual([
                ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'description', 'B:0'
            ]);
        }
    });


    it('missing parent in library category', () => {

        const builtInCategories = {} as any;

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'B:0': {
                categoryName: 'B',
                commons: [],
                fields: {},
                groups: [],
                createdBy: '',
                valuelists: {},
                creationDate: '',
                description: {}
            }
        };

        try {
            buildRawProjectConfiguration(
                builtInCategories,
                libraryCategories,
                {}, {}, {}, {}
            );
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'parent', 'B:0']);
        }
    });


    it('missing parent in custom category', () => {

        const customCategories: Map<CustomCategoryDefinition> = {
            'B:0': { fields: {} }
        };

        try {
            buildRawProjectConfiguration(
                {},
                {},
                customCategories,
                {},
                {},
                {}
            );
        } catch (expected) {
            expect(expected).toEqual([
                ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'parent', 'B:0', 'must be set for new categories'
            ]);
        }
    });


    it('merge library category with builtIn', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: {
                fields: {
                    field1: { inputType: InputType.TEXT }
                },
                groups: []
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:1': {
                categoryName: 'A',
                commons: [],
                valuelists: {},
                fields: {
                    field1: {},
                    field2: { inputType: InputType.TEXT }
                },
                groups: [
                    { name: Groups.STEM, fields: ['field1'] },
                    { name: Groups.PARENT, fields: ['field2'] }
                ],
                creationDate: '',
                createdBy: '',
                description: {}
            }
        };

        const result = buildRaw(
            builtInCategories, libraryCategories,
            { 'A:1': { hidden: [], fields: {} } },
            {}, {}, {}
        );

        expect(result['A'].groups[0].fields[0].inputType).toBe(InputType.TEXT);
        expect(result['A'].groups[0].name).toBe(Groups.STEM);
        expect(result['A'].groups[1].fields[0].inputType).toBe(InputType.TEXT);
        expect(result['A'].groups[1].name).toBe(Groups.PARENT);
    });


    it('merge custom categories with built-in categories', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: {
                fields: {
                    field1: { inputType: 'text' }
                },
                groups: []
            }
        };

        const customCategories: Map<CustomCategoryDefinition> = {
            A: {
                fields: {
                    field1: {},
                    field2: { inputType: 'text' }
                }
            }
        };

        const result = buildRaw(
            builtInCategories, {}, customCategories,
            {}, {}, {}
        );

        expect(result['A'].groups[0].fields[0].inputType).toBe('text');
        expect(result['A'].groups[0].fields[1].inputType).toBe('text');
    });


    it('merge custom categories with library categories', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: {
                fields: {
                    field1: { inputType: InputType.TEXT }
                },
                groups: []
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:0': {
                categoryName: 'A',
                commons: [],
                valuelists: {},
                fields: {
                    field2: { inputType: InputType.TEXT }
                },
                groups: [
                    { name: Groups.STEM, fields: ['field1'] },
                    { name: Groups.PARENT, fields: ['field2', 'field3'] }
                ],
                creationDate: '',
                createdBy: '',
                description: {}
            }
        };

        const customCategories: Map<CustomCategoryDefinition> = {
            'A:0': {
                fields: {
                    field2: {},
                    field3: { inputType: InputType.TEXT }
                }
            }
        };

        const result = buildRaw(
            builtInCategories, libraryCategories, customCategories,
            {}, {}, {}
        );

        expect(result['A'].groups[0].fields[0].inputType).toBe(InputType.TEXT);
        expect(result['A'].groups[0].name).toBe(Groups.STEM);
        expect(result['A'].groups[1].fields[0].inputType).toBe(InputType.TEXT);
        expect(result['A'].groups[1].fields[1].inputType).toBe(InputType.TEXT);
        expect(result['A'].groups[1].name).toBe(Groups.PARENT);
    });


    it('source field', () => {

        const commonFields = {
            aCommon: { inputType: FieldDefinition.InputType.INPUT }
        };

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: {
                fields: {
                    field1: { inputType: FieldDefinition.InputType.TEXT }
                },
                groups: [
                    { name: Groups.STEM, fields: ['field1'] }
                ]
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:0': {
                categoryName: 'A',
                commons: ['aCommon'],
                valuelists: {},
                fields: {
                    field2: { inputType: FieldDefinition.InputType.TEXT }
                },
                groups: [
                    { name: Groups.STEM, fields: ['field1'] },
                    { name: Groups.PARENT, fields: ['aCommon', 'field2', 'field3'] },
                ],
                creationDate: '',
                createdBy: '',
                description: {}
            }
        };

        const customCategories: Map<CustomCategoryDefinition> = {
            'A:0': {
                fields: {
                    field2: {},
                    field3: { inputType: FieldDefinition.InputType.TEXT }
                }
            }
        };

        const result = buildRaw(
            builtInCategories, libraryCategories, customCategories, commonFields,
            {}, {}
        );

        expect(result['A'].groups[0].fields[0].source).toBe(FieldDefinition.Source.BUILTIN);
        expect(result['A'].groups[0].name).toBe(Groups.STEM);
        expect(result['A'].groups[1].fields[0].source).toBe(FieldDefinition.Source.COMMON);
        expect(result['A'].groups[1].fields[1].source).toBe(FieldDefinition.Source.LIBRARY);
        expect(result['A'].groups[1].fields[2].source).toBe(FieldDefinition.Source.CUSTOM);
        expect(result['A'].groups[1].name).toBe(Groups.PARENT);
    });


    it('set group labels', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {
                    field1: { inputType: FieldDefinition.InputType.TEXT },
                    field2: { inputType: FieldDefinition.InputType.TEXT }
                },
                groups: [{ name: Groups.STEM, fields: ['field1', 'field2'] }]
            }
        };

        const customCategories: Map<CustomCategoryDefinition> = {
            A: {
                fields: { field3: { inputType: FieldDefinition.InputType.TEXT } },
                groups: [
                    { name: Groups.STEM, fields: ['field1', 'field2'] },
                    { name: Groups.PARENT, fields: ['field3'] }
                ]
            },
            B: {
                parent: 'A', fields: { field4: { inputType: FieldDefinition.InputType.TEXT } },
                groups: [
                    { name: Groups.STEM, fields: ['field1', 'field2'] },
                    { name: Groups.PARENT, fields: ['field3'] },
                    { name: Groups.CHILD, fields: ['field4'] }
                ]
            }
        };

        const languageConfigurations = {
            complete: {
                de: [{
                    groups: {
                        'stem': 'Stem',
                        'parent': 'Parent'
                    },
                    categories: {
                        'A': { label: 'A_' },
                        'B': { label: 'B_' }
                    }
                }]
            },
            default: {}
        };

        const result = buildRaw(
            builtInCategories, {}, customCategories, {}, {}, {}, [], languageConfigurations
        );

        expect(result['A'].groups[0].label.de).toEqual('Stem');
        expect(result['A'].groups[1].label.de).toEqual('A_');

        expect(result['B'].groups[0].label.de).toEqual('Stem');
        expect(result['B'].groups[1].label.de).toEqual('A_');
        expect(result['B'].groups[2].label.de).toEqual('B_');
    });


    it('apply categories order', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            B: { fields: {}, groups: [] },
            A: { fields: {}, groups: [] },
            C: { fields: {}, groups: [] },
        };

        const customCategories: Map<CustomCategoryDefinition> = {
            B: { fields: {} },
            A: { fields: {} },
            C: { fields: {} }
        };

        const orderConfiguration = ['C', 'A'];

        const result = buildRawArray(
            builtInCategories, {}, customCategories, {}, {}, {}, [], { default: {}, complete: {} }, {},
            orderConfiguration
        ).map(Named.toName);

        expect(result).toEqual(['C', 'A', 'B']);
    });


    it('apply categories order to children', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            B: { fields: {}, groups: [], parent: 'D' },
            A: { fields: {}, groups: [], parent: 'D' },
            C: { fields: {}, groups: [], parent: 'D' },
            D: { fields: {}, groups: [] }
        };

        const customCategories: Map<CustomCategoryDefinition> = {
            B: { fields: {} },
            A: { fields: {} },
            C: { fields: {} },
            D: { fields: {} }
        };

        const orderConfiguration = ['C', 'A'];

        const result = buildRaw(
            builtInCategories, {}, customCategories, {}, {}, {}, [], { default: {}, complete: {} }, {},
            orderConfiguration
        )['D'].children.map(to(Named.NAME));

        expect(result).toEqual(['C', 'A', 'B']);
    });


    it('put relations into groups', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            P: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {},
                groups: []
            },
        };

        const customCategories: Map<CustomCategoryDefinition> = {
            C: {
                fields: {},
                parent: 'P'
            }
        };

        const result = buildRaw(
            builtInCategories, {}, customCategories, {}, {}, {}, [
                {
                    name: 'isAbove',
                    inverse: 'isBelow',
                    label: 'relationLabel',
                    domain: ['P:inherit'],
                    range: ['P:inherit'],
                    sameMainCategoryResource: true
                },
            ]
        );

        // First group is always the (auto-generated) stem group, position group is expected as second group
        const parentGroup = result['P'].groups[1];
        const childGroup = result['P'].children[0].groups[1];

        expect(parentGroup.name).toEqual('position');
        expect(parentGroup.relations[0].name).toEqual('isAbove');
        expect(childGroup.name).toEqual('position');
        expect(childGroup.relations[0].name).toEqual('isAbove');
    });


    it('put geometry into groups', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            P: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {},
                groups: []
            },
        };

        const customCategories: Map<CustomCategoryDefinition> = {
            C: {
                fields: {},
                parent: 'P'
            }
        };

        const languageConfigurations = {
            complete: {
                en: [{
                    other: { geometry: 'Geometry' }
                }]
            },
            default: {}
        };

        const result = buildRaw(
            builtInCategories, {}, customCategories, {}, {}, {}, [], languageConfigurations
        );

        // First group is always the (auto-generated) stem group, position group is expected as second group
        const parentGroup = result['P'].groups[1];
        const childGroup = result['P'].children[0].groups[1];

        expect(parentGroup.name).toEqual('position');
        expect(parentGroup.fields[0].name).toEqual('geometry');
        expect(parentGroup.fields[0].label.en).toEqual('Geometry');
        expect(childGroup.name).toEqual('position');
        expect(childGroup.fields[0].name).toEqual('geometry');
        expect(childGroup.fields[0].label.en).toEqual('Geometry');
    });


    it('link parent and child instances', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            P: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {},
                groups: []
            },
        };

        const customCategories: Map<CustomCategoryDefinition> = {
            C: {
                fields: {},
                parent: 'P'
            }
        };

        const categoriesTree = buildRawProjectConfiguration(
            builtInCategories, {}, customCategories, {}, {}, {}, [], { default: {}, complete: {} }
        )[0];

        expect((Tree.access(categoriesTree, 0) as any).children[0].name).toBe('C');
        expect((Tree.access(categoriesTree, 0, 0) as any).name).toBe('C');
        expect((Tree.access(categoriesTree, 0) as any).children[0] === Tree.access(categoriesTree, 0, 0)).toBeTruthy();

        expect((Tree.access(categoriesTree, 0) as any).name).toBe('P');
        expect((Tree.access(categoriesTree, 0, 0) as any).parentCategory.name).toBe('P');
        expect((Tree.access(categoriesTree, 0, 0) as any).parentCategory === Tree.access(categoriesTree, 0)).toBeTruthy();
    });


    it('allow overwriting color', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: {
                fields: {},
                groups: []
            },
            B: {
                fields: {},
                groups: []
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A:0': {
                categoryName: 'A',
                commons: [],
                valuelists: {},
                fields: {},
                groups: [],
                creationDate: '',
                createdBy: '',
                description: {},
                color: 'blue'
            }
        };

        const customCategories: Map<CustomCategoryDefinition> = {
            'A:0': {
                fields: {},
                color: 'red'
            },
            B: {
                fields: {},
                color: 'red'
            }
        };

        const result = buildRaw(
            builtInCategories, libraryCategories, customCategories,
            {}, {}, {}
        );

        expect(result['A'].color).toBe('red');
        expect(result['A'].defaultColor).toBe('blue');
        expect(result['B'].color).toBe('red');
        expect(result['B'].defaultColor).toBe('#000042');   // Auto-generated color
    });


    // err cases

    /*xit('critical change of input type', () => {

        const builtInCategories: Map<BuiltinCategoryDefinition> = {
            A: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields : {}
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'B:0': {
                categoryName: 'B',
                parent: 'A',
                commons: [],
                valuelists: {},
                fields: {
                    field1: { inputType: 'text' }
                },
                creationDate: '',
                createdBy: '',
                description: {}
            }
        };

        const customCategories: Map<CustomCategoryDefinition> = {
            'B:0': {
                fields: {
                    field1: { inputType: 'radio' }
                },
                valuelists: {
                    field1: 'valuelist_field1'
                }
            }
        };

        const result = buildRawProjectConfiguration(
            builtInCategories, libraryCategories, customCategories,
            {}, {}, {}
        );

        // expectation?
    });*/
});
