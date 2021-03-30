import {Map} from 'tsfun';
import {FieldDefinition} from 'idai-field-core';
import {BuiltinCategoryDefinition} from '../../../../../src/app/core/configuration/model/builtin-category-definition';
import {LibraryCategoryDefinition} from '../../../../../src/app/core/configuration/model/library-category-definition';
import {CustomCategoryDefinition} from '../../../../../src/app/core/configuration/model/custom-category-definition';
import {Assertions} from '../../../../../src/app/core/configuration/boot/assertions';
import {ConfigurationErrors} from '../../../../../src/app/core/configuration/boot/configuration-errors';


describe('Assertions', () => {

   it('cannot overwrite valuelist of common fields where valuelistFromProjectField is set', () => {

       const commonFields = {
           aCommon: {
               inputType: FieldDefinition.InputType.INPUT,
               valuelistFromProjectField: 'abc'
           }
       };

       const builtInCategories: Map<BuiltinCategoryDefinition> = {
           C: { fields: {} },
       };
       const libraryCategories: Map<LibraryCategoryDefinition> = {
           'C:default': {
               categoryName: 'C',
               fields: {},
               valuelists: {'aCommon': 'cde' /* not allowed */},
               commons: ['aCommon'],
               description: {},
               createdBy: '',
               creationDate: ''
           },
       };
       const customCategories: Map<CustomCategoryDefinition> = {
           C: { fields: {} }
       };

       try {
           Assertions.performAssertions(builtInCategories, libraryCategories, customCategories, commonFields, {});
           fail();
       } catch (expected) {
           expect(expected).toEqual(
               [ConfigurationErrors.COMMON_FIELD_VALUELIST_FROM_PROJECTDOC_NOT_TO_BE_OVERWRITTEN, 'C:default', 'aCommon']);
       }
   });
});
