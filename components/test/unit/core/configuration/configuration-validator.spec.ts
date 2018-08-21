import {ConfigurationDefinition} from '../../../../src/core/configuration/configuration-definition';
import {ConfigurationValidator} from '../../../../src/core/configuration/configuration-validator';
import {ConfigurationErrors} from '../../../../src/core/configuration/configuration-errors';


/**
 * @author Daniel de Oliveira
 */
describe('ConfigurationValidator', () => {

    let configuration: ConfigurationDefinition;


    it('should report duplicate type', function() {

        configuration = {
            identifier: 'test',
            types : [
                { type: 'Tduplicate', fields: []},
                { type: 'Tduplicate', fields: []}
            ],
            relations: []
        };

        expect(new ConfigurationValidator()
            .go(configuration))
            .toContain([ConfigurationErrors.INVALID_CONFIG_DUPLICATETYPE,'Tduplicate']);
    });


    it('should report missing parent type', function() {

        configuration = {
            identifier: 'test',
            types : [{ type: 'T', fields: [], parent: 'P'}],
            relations: []
        };

        expect(new ConfigurationValidator()
            .go(configuration))
            .toContain([ConfigurationErrors.INVALID_CONFIG_MISSINGPARENTTYPE,'P']);
    });


    it('should report unnamed type', function() {

        configuration = {
            identifier: 'test',
            types : [{ fields: []} as any],
            relations: []
        };

        expect(new ConfigurationValidator()
            .go(configuration))
            .toContain([ConfigurationErrors.INVALID_CONFIG_INVALIDTYPE,
                JSON.stringify({ fields: []})]);
    });
});
