import { Map } from 'tsfun';
import { LibraryCategoryDefinition, TransientFormDefinition } from '../../../src/configuration';
import { Assertions } from '../../../src/configuration/boot/assertions';
import { ConfigurationErrors } from '../../../src/configuration/boot/configuration-errors';
import { BuiltInCategoryDefinition } from '../../../src/configuration/model/category/built-in-category-definition';
import { CustomFormDefinition } from '../../../src/configuration/model/form/custom-form-definition';
import { LibraryFormDefinition } from '../../../src/configuration/model/form/library-form-definition';
import { Field } from '../../../src/model/configuration/field';


describe('Assertions', () => {

   it('cannot overwrite valuelist of common fields where valuelistFromProjectField is set', () => {

        const commonFields = {
            aCommon: {
                inputType: Field.InputType.CHECKBOXES,
                valuelistFromProjectField: 'abc'
            }
        };

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            C: {
                fields: {},
                minimalForm: { groups: [] }
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'C:default': {
                categoryName: 'C',
                valuelists: {
                    aCommon: 'cde' // not allowed
                },
                groups: [],
                description: {},
                createdBy: '',
                creationDate: ''
            },
        };
       
        const customForms: Map<CustomFormDefinition> = {
                C: { fields: {} }
        };

        try {
                Assertions.performAssertions(builtInCategories, {}, libraryForms, commonFields, {}, customForms);
                fail();
        } catch (expected) {
                expect(expected).toEqual([
                    ConfigurationErrors.COMMON_FIELD_VALUELIST_FROM_PROJECTDOC_NOT_TO_BE_OVERWRITTEN,
                    'C:default', 'aCommon'
                ]);
        }
   });


   it('assert input types are set in built-in category fields', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            C: {
                fields: {
                    field1: {}
                },
                minimalForm: { groups: [] }
            }
        };
        
        const customForms: Map<CustomFormDefinition> = {
            C: { fields: {} }
        };

        try {
            Assertions.performAssertions(builtInCategories, {}, {}, {}, {}, customForms);
            fail();
        } catch (expected) {
            expect(expected).toEqual([[
                ConfigurationErrors.MISSING_FIELD_PROPERTY,
                'inputType', 'C', 'field1'
            ]]);
        }
    });


    it('assert input types are set in library category fields', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            C: {
                fields: {
                    field1: {
                        inputType: 'text'
                    }
                },
                minimalForm: { groups: [] }
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            C: {
                description: {},
                fields: {
                    field2: {}
                }
            }
        };
        
        const customForms: Map<CustomFormDefinition> = {
            C: { fields: {} }
        };

        try {
            Assertions.performAssertions(builtInCategories, libraryCategories, {}, {}, {}, customForms);
            fail();
        } catch (expected) {
            expect(expected).toEqual([[
                ConfigurationErrors.MISSING_FIELD_PROPERTY,
                'inputType', 'C', 'field2'
            ]]);
        }
    });


    it('allow missing input types in custom form fields', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            C: {
                fields: {
                    field1: {
                        inputType: 'text'
                    }
                },
                minimalForm: { groups: [] }
            }
        };
        
        const customForms: Map<CustomFormDefinition> = {
            C: {
                fields: {
                    field1: { constraintIndexed: true }
                }
            }
        };

        try {
            Assertions.performAssertions(builtInCategories, {}, {}, {}, {}, customForms);
        } catch (err) {
            fail(err);
        }
    });


    it('assert no duplication in selection', () => {
        
        const forms: Map<TransientFormDefinition> = {
            'C:default': {
                name: 'C:default',
                categoryName: 'C',
                valuelists: {},
                fields: {},
                groups: [],
                description: {},
                createdBy: '',
                creationDate: ''
            },
            'C:other': {
                name: 'C:other',
                categoryName: 'C',
                valuelists: {},
                fields: {},
                groups: [],
                description: {},
                createdBy: '',
                creationDate: ''
            },
       };

        const customForms: Map<CustomFormDefinition> = {
            'C:default': { fields: {} },
            'C:other': { fields: {} }
        };

        try {
            Assertions.assertNoDuplicationInSelection(customForms)(forms);
            fail();
        } catch (expected) {
            expect(expected).toEqual([[ConfigurationErrors.DUPLICATION_IN_SELECTION, 'C']]);
        }
    });
});
