import {ProjectConfigurationUtils} from '../../../../app/core/configuration/project-configuration-utils';
import {ConfigurationDefinition} from '../../../../app/core/configuration/boot/configuration-definition';

describe('ProjectConfigurationUtils', () => {

   it('makeTypesMap', () => {

      const confDef: ConfigurationDefinition = {
         relations: [],
         identifier: '',
         types: [{
            type: 'A',
            parent: 'P',
            fields: [{ name: 'a', inputType: 'input' }]
         },{
            type: 'P',
            fields: [{ name: 'p', inputType: 'input' }]
         }]
      };

      const result = ProjectConfigurationUtils.makeTypesMap(confDef);

      expect(result['P'].name).toEqual('P');
      expect(result['P'].children[0].name).toEqual('A');
      expect(result['P'].children[0].fields.length).toBe(2);
      expect(result['P'].children[0].parentType).toBe(result['P']);
      expect(result['A'].name).toEqual('A');
      expect(result['A'].parentType).toBe(result['P']);
   });
});