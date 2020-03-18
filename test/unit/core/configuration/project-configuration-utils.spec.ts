import {ProjectConfigurationUtils} from '../../../../app/core/configuration/project-configuration-utils';
import {ConfigurationDefinition} from '../../../../app/core/configuration/boot/configuration-definition';
import {SortUtil} from '../../../../app/core/util/sort-util';
import {Group} from '../../../../app/core/configuration/group-util';

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

      expect(typesMap[A].fields[0].group).toBe(Group.CHILD);
      expect(typesMap[A].fields[1].group).toBe(Group.PARENT);
      expect(typesMap[P].fields[0].group).toBe(Group.PARENT);

      expect(typesMap[A].groups[Group.PARENT].fields[0].group).toBe(Group.PARENT);
      expect(typesMap[A].groups[Group.CHILD].fields[0].group).toBe(Group.CHILD);
      expect(typesMap[P].groups[Group.PARENT].fields[0].group).toBe(Group.PARENT);
   });
});