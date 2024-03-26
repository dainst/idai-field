import { validateReferences } from '../../../../../src/app/components/configuration/validation/validate-references';


describe('validate references', () => {

    it('perform validation', () => {
        
        try {
            validateReferences(['http://www.example.de']);
        } catch(err) {
            fail();
        }

        try {
            validateReferences(['https://www.example.de']);
        } catch(err) {
            fail();
        }

        try {
            validateReferences(['www.example.de']);
            fail();
        } catch(err) {}

        try {
            validateReferences(['abc']);
            fail();
        } catch(err) {}
    });
});
