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


    it('must set parent if type is new', () => {

        const buildInTypes = [];
        const libraryTypes = [];

        const customType = {
            fields: {},
            hidden: []
        };
        const assertIsValid = CustomTypeDefinition.makeAssertIsValid(buildInTypes, libraryTypes);
        try {
            assertIsValid(['A', customType]);
            fail();
        } catch (expected) {
            expect(expected).toEqual(
                [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'parent', 'A', 'must be set for new types']);

        }
    });


    it('must not set parent if type exists as library type - exists as libraryType', () => {

        const buildInTypes = [];
        const libraryTypes = ['A:libraryType'];

        const customType = {
            parent: 'B',
            fields: {},
            hidden: []
        };
        const assertIsValid = CustomTypeDefinition.makeAssertIsValid(buildInTypes, libraryTypes);
        try {
            assertIsValid(['A:libraryType', customType]);
            fail();
        } catch (expected) {
            expect(expected).toEqual(
                [ConfigurationErrors.ILLEGAL_TYPE_PROPERTY, 'parent', 'A:libraryType', 'must not be set if not a new type']);

        }
    });


    it('must not set parent if type exists as library type - exists as buildInType', () => {

        const buildInTypes = ['A'];
        const libraryTypes = [];

        const customType = {
            parent: 'B',
            fields: {},
            hidden: []
        };
        const assertIsValid = CustomTypeDefinition.makeAssertIsValid(buildInTypes, libraryTypes);
        try {
            assertIsValid(['A', customType]);
            fail();
        } catch (expected) {
            expect(expected).toEqual(
                [ConfigurationErrors.ILLEGAL_TYPE_PROPERTY, 'parent', 'A', 'must not be set if not a new type']);

        }
    });
});