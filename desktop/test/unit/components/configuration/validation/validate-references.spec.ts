import { validateReferences } from '../../../../../src/app/components/configuration/validation/validate-references';
import { M } from '../../../../../src/app/components/messages/m';


describe('validate references', () => {

    test('perform validation', () => {
        
        validateReferences([{ predicate: 'skos:exactMatch', uri: 'http://www.example.de' }]);
        validateReferences([{ predicate: 'skos:exactMatch', uri: 'https://www.example.de' }]);

        try {
            validateReferences([{ predicate: 'skos:exactMatch', uri: 'www.example.de' }]);
            throw new Error('Test failure');
        } catch(err) {
            expect(err).toEqual([M.CONFIGURATION_ERROR_INVALID_REFERENCE, 'www.example.de']);
        }

        try {
            validateReferences([{ predicate: 'skos:exactMatch', uri: 'abc' }]);
            throw new Error('Test failure');
        } catch(err) {
            expect(err).toEqual([M.CONFIGURATION_ERROR_INVALID_REFERENCE, 'abc']);
        }
    });
});
