import { validateReferences,
    validateSemanticReferences } from '../../../../../src/app/components/configuration/validation/validate-references';
import { M } from '../../../../../src/app/components/messages/m';


describe('validate references', () => {

    test('validate general references', () => {
        
        validateReferences(['http://www.example.de']);
        validateReferences(['https://www.example.de']);

        try {
            validateReferences(['www.example.de']);
            throw new Error('Test failure');
        } catch(err) {
            expect(err).toEqual([M.CONFIGURATION_ERROR_INVALID_REFERENCE, 'www.example.de']);
        }

        try {
            validateReferences(['abc']);
            throw new Error('Test failure');
        } catch(err) {
            expect(err).toEqual([M.CONFIGURATION_ERROR_INVALID_REFERENCE, 'abc']);
        }
    });


    test('validate semantic references', () => {
        
        validateSemanticReferences([{ predicate: 'skos:exactMatch', uri: 'http://www.example.de' }]);
        validateSemanticReferences([{ predicate: 'skos:exactMatch', uri: 'https://www.example.de' }]);

        try {
            validateSemanticReferences([{ predicate: 'skos:exactMatch', uri: 'www.example.de' }]);
            throw new Error('Test failure');
        } catch(err) {
            expect(err).toEqual([M.CONFIGURATION_ERROR_INVALID_REFERENCE, 'www.example.de']);
        }

        try {
            validateSemanticReferences([{ predicate: 'skos:exactMatch', uri: 'abc' }]);
            throw new Error('Test failure');
        } catch(err) {
            expect(err).toEqual([M.CONFIGURATION_ERROR_INVALID_REFERENCE, 'abc']);
        }
    });
});
