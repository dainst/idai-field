import {ProjectConfigurationUtils} from '../../../../app/core/configuration/project-configuration-utils';
import {ConfigurationDefinition} from '../../../../app/core/configuration/boot/configuration-definition';

describe('ProjectConfigurationUtils', () => {

   it('initTypes', () => {

      const confDef: ConfigurationDefinition = {
         relations: [],
         identifier: '',
         types: [{
            type: 'A',
            parent: 'P'
         },{
            type: 'P'
         }]
      };

      const result = ProjectConfigurationUtils.initTypes(confDef);

      expect(result['A'].name).toEqual('A');
      expect(result['P'].name).toEqual('P');
   });
});