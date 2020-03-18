import {FieldResource} from 'idai-components-2';
import {ProjectConfigurationUtils} from '../../../../app/core/configuration/project-configuration-utils';
import {ConfigurationDefinition} from '../../../../app/core/configuration/boot/configuration-definition';
import {SortUtil} from '../../../../app/core/util/sort-util';
import {Groups} from '../../../../app/core/configuration/model/group';
import {FieldDefinition} from '../../../../app/core/configuration/model/field-definition';
import InputType = FieldDefinition.InputType;


const byName = (a, b) => SortUtil.alnumCompare(a.name, b.name);

/**
 * @author Daniel de Oliveira
 */
describe('ProjectConfigurationUtils', () => {

   it('makeTypesMap', () => {

      const A = 'A';
      const P = 'P';

      const confDef: ConfigurationDefinition = {
         relations: [],
         identifier: '',
         types: [{
            type: A,
            parent: P,
            fields: [{ name: 'a', inputType: 'input' }]
         }, {
            type: P,
            fields: [{ name: 'p', inputType: 'input' }]
         }]
      };

      const typesMap = ProjectConfigurationUtils.makeTypesMap(confDef);

      expect(typesMap[P].name).toEqual(P);
      expect(typesMap[P].children[0].name).toEqual(A);
      expect(typesMap[P].children[0].fields.length).toBe(2);
      expect(typesMap[P].children[0].parentType).toBe(typesMap[P]);
      expect(typesMap[A].name).toEqual(A);
      expect(typesMap[A].parentType).toBe(typesMap[P]);

      typesMap[A].fields.sort(byName);

      expect(typesMap[A].fields[0].group).toBe(Groups.CHILD);
      expect(typesMap[A].fields[1].group).toBe(Groups.PARENT);
      expect(typesMap[P].fields[0].group).toBe(Groups.PARENT);

      expect(typesMap[A].groups[0].fields[0].group).toBe(Groups.PARENT);
      expect(typesMap[A].groups[1].fields[0].group).toBe(Groups.CHILD);
      expect(typesMap[P].groups[0].fields[0].group).toBe(Groups.PARENT);
   });


   it('sortFields', () => {

      const T = 'T';

      const confDef: ConfigurationDefinition = {
         relations: [],
         identifier: '',
         types: [{
            type: T,
            fields:
                [
                    {
                       name: FieldResource.SHORTDESCRIPTION,
                       inputType: InputType.INPUT,
                       group: Groups.STEM },
                   {
                      name: FieldResource.IDENTIFIER,
                      inputType: InputType.INPUT,
                      group: Groups.STEM }
                ]
         }]
      };

      const typesMap = ProjectConfigurationUtils.makeTypesMap(confDef);

      expect(typesMap[T].groups[0].fields[0].name).toEqual(FieldResource.IDENTIFIER);
      expect(typesMap[T].groups[0].fields[1].name).toEqual(FieldResource.SHORTDESCRIPTION);
   });
});