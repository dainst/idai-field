import {CustomCategoryDefinition} from '../../../../../src/app/core/configuration/model/custom-category-definition';
import {ConfigurationErrors} from '../../../../../src/app/core/configuration/boot/configuration-errors';

describe('CustomCategoryDefinition', () => {

    it('illegal category property', () => {

        const builtInCategories = [];
        const libraryCategories = [];

        const customCategory = {
            parent: 'B',
            categoryName: 'B',
            fields: {},
            hidden: []
        };
        const assertIsValid = CustomCategoryDefinition.makeAssertIsValid(builtInCategories, libraryCategories);
        try {
            assertIsValid(['A', customCategory]);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ConfigurationErrors.ILLEGAL_CATEGORY_PROPERTY, 'categoryName', 'A']);
        }
    });


    it('must set parent if category is new', () => {

        const builtInCategories = [];
        const libraryCategories = [];

        const customCategory = {
            fields: {},
            hidden: []
        };
        const assertIsValid = CustomCategoryDefinition.makeAssertIsValid(builtInCategories, libraryCategories);
        try {
            assertIsValid(['A', customCategory]);
            fail();
        } catch (expected) {
            expect(expected).toEqual(
                [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'parent', 'A', 'must be set for new categories']);

        }
    });


    it('must not set parent if category exists as library category - exists as library category', () => {

        const builtInCategories = [];
        const libraryCategories = ['A:libraryCategory'];

        const customCategory = {
            parent: 'B',
            fields: {},
            hidden: []
        };
        const assertIsValid = CustomCategoryDefinition.makeAssertIsValid(builtInCategories, libraryCategories);
        try {
            assertIsValid(['A:libraryCategory', customCategory]);
            fail();
        } catch (expected) {
            expect(expected).toEqual(
                [ConfigurationErrors.ILLEGAL_CATEGORY_PROPERTY, 'parent', 'A:libraryCategory', 'must not be set if not a new category']);

        }
    });


    it('must not set parent if category exists as library category - exists as builtIn category', () => {

        const builtInCategories = ['A'];
        const libraryCategories = [];

        const customCategory = {
            parent: 'B',
            fields: {},
            hidden: []
        };
        const assertIsValid = CustomCategoryDefinition.makeAssertIsValid(builtInCategories, libraryCategories);
        try {
            assertIsValid(['A', customCategory]);
            fail();
        } catch (expected) {
            expect(expected).toEqual(
                [ConfigurationErrors.ILLEGAL_CATEGORY_PROPERTY, 'parent', 'A', 'must not be set if not a new category']);

        }
    });
});
