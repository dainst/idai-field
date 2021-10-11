import { Map } from 'tsfun';
import { mergeBuiltInWithLibraryCategories } from '../../../src/configuration/boot/merge-built-in-with-library-categories';
import { BuiltInCategoryDefinition } from '../../../src/configuration/model/category/built-in-category-definition';
import { LibraryCategoryDefinition } from '../../../src/configuration/model/category/library-category-definition';
import { TransientCategoryDefinition } from '../../../src/configuration/model/category/transient-category-definition';


/**
 * @author Thomas Kleinke
 */
describe('merge built-in with library categories', () => {

    it('perform merge', () => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            Category1: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {
                    field1: {
                        inputType: 'text',
                        visible: false
                    }
                },
                minimalForm: {
                    groups: [
                        {
                            name: 'group1',
                            fields: ['field1']
                        }
                    ]
                }
            },
            Category2: {
                fields: {
                    field1: {
                        inputType: 'boolean'
                    }
                },
                minimalForm: {
                    groups: [
                        {
                            name: 'group1',
                            fields: ['field1']
                        }
                    ]
                }
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            Category1: {
                description: { en: 'Category 1 description' },
                fields: {
                    field2: {
                        inputType: 'unsignedInt',
                        constraintIndexed: true
                    }
                }
            },
            Category3: {
                parent: 'Category1',
                description: { en: 'Category 3 description' },
                fields: {
                    field4: {
                        inputType: 'literature',
                        constraintIndexed: true
                    }
                }
            }
        };

        const result: Map<TransientCategoryDefinition> = mergeBuiltInWithLibraryCategories(
            builtInCategories, libraryCategories
        );

        expect(Object.keys(result).length).toBe(3);

        expect(result['Category1'].supercategory).toBe(true);
        expect(result['Category1'].userDefinedSubcategoriesAllowed).toBe(true);
        expect(result['Category1'].description.en).toBe('Category 1 description');
        expect(Object.keys(result['Category1'].fields).length).toBe(2);
        expect(result['Category1'].fields['field1'].inputType).toBe('text');
        expect(result['Category1'].fields['field1'].visible).toBe(false);
        expect(result['Category1'].fields['field2'].inputType).toBe('unsignedInt');
        expect(result['Category1'].fields['field2'].constraintIndexed).toBe(true);
        expect(result['Category1'].minimalForm.groups.length).toBe(1);
        expect(result['Category1'].minimalForm.groups[0].name).toBe('group1');
        expect(result['Category1'].minimalForm.groups[0].fields).toEqual(['field1']);

        expect(Object.keys(result['Category2'].fields).length).toBe(1);
        expect(result['Category2'].fields['field1'].inputType).toBe('boolean');
        expect(result['Category2'].minimalForm.groups.length).toBe(1);
        expect(result['Category2'].minimalForm.groups[0].name).toBe('group1');
        expect(result['Category2'].minimalForm.groups[0].fields).toEqual(['field1']);

        expect(result['Category3'].parent).toBe('Category1');
        expect(result['Category3'].description.en).toBe('Category 3 description');
        expect(Object.keys(result['Category3'].fields).length).toBe(1);
        expect(result['Category3'].fields['field4'].inputType).toBe('literature');
        expect(result['Category3'].fields['field4'].constraintIndexed).toBe(true);
    });
});
