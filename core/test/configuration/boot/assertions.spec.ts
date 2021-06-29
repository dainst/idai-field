import { Map } from 'tsfun';
import { Assertions, ConfigurationErrors } from '../../../src/configuration/boot';
import { BuiltinCategoryDefinition, CustomCategoryDefinition,
    LibraryCategoryDefinition } from '../../../src/configuration/model';
import { FieldDefinition } from '../../../src/model';


describe('Assertions', () => {

   it('cannot overwrite valuelist of common fields where valuelistFromProjectField is set', () => {

       const commonFields = {
           aCommon: {
               inputType: FieldDefinition.InputType.INPUT,
               valuelistFromProjectField: 'abc'
           }
       };

       const builtInCategories: Map<BuiltinCategoryDefinition> = {
           C: { fields: {}, groups: [] },
       };

       const libraryCategories: Map<LibraryCategoryDefinition> = {
           'C:default': {
               categoryName: 'C',
               fields: {},
               valuelists: {'aCommon': 'cde' /* not allowed */},
               commons: ['aCommon'],
               groups: [],
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
