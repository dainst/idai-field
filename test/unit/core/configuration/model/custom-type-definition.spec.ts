import {CustomTypeDefinition} from '../../../../../app/core/configuration/model/custom-type-definition';
import {ConfigurationErrors} from '../../../../../app/core/configuration/configuration-errors';

describe('CustomTypeDefinition', () => {

    it('illegalTypeProperty', () => {

        const buildInTypes = [];
        const libraryTypes = [];

        const customType = {
            parent: 'B',
            typeFamily: 'B',
            fields: {},
            hidden: []
        };
        const assertIsValid = CustomTypeDefinition.makeAssertIsValid(buildInTypes, libraryTypes);
        try {
            assertIsValid(['A', customType]);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.ILLEGAL_TYPE_PROPERTY, 'typeFamily']);
        }
    });
});