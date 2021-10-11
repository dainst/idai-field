import { ConfigurationErrors } from '../../../src/configuration/boot/configuration-errors';
import { CustomFormDefinition } from '../../../src/configuration/model/form/custom-form-definition';


describe('CustomFormDefinition', () => {

    it('illegal custom form property', () => {

        const formNames = [];

        const customForm = {
            parent: 'B',
            categoryName: 'B',
            fields: {},
            hidden: []
        };

        const assertIsValid = CustomFormDefinition.makeAssertIsValid(formNames);

        try {
            assertIsValid(['A', customForm]);
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                ConfigurationErrors.ILLEGAL_CUSTOM_FORM_PROPERTY,
                'categoryName', 'A'
            ]);
        }
    });


    it('must set parent if category is new', () => {

        const formNames = [];

        const customForm = {
            fields: {},
            hidden: []
        };

        const assertIsValid = CustomFormDefinition.makeAssertIsValid(formNames);

        try {
            assertIsValid(['A', customForm]);
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                ConfigurationErrors.MISSING_FORM_PROPERTY,
                'parent', 'A', 'must be set for new categories'
            ]);
        }
    });


    it('must not set parent if form already exists', () => {

        const formNames = ['A:libraryForm'];

        const customForm = {
            parent: 'B',
            fields: {},
            hidden: []
        };

        const assertIsValid = CustomFormDefinition.makeAssertIsValid(formNames);

        try {
            assertIsValid(['A:libraryForm', customForm]);
            fail();
        } catch (expected) {
            expect(expected).toEqual([
                ConfigurationErrors.ILLEGAL_CUSTOM_FORM_PROPERTY,
                'parent', 'A:libraryForm', 'must not be set if not a new category'
            ]);
        }
    });
});
