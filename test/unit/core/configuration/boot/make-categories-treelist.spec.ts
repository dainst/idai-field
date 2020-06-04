import {FieldResource} from 'idai-components-2';
import {Groups} from '../../../../../src/app/core/configuration/model/group';
import {FieldDefinition} from '../../../../../src/app/core/configuration/model/field-definition';
import {Category} from '../../../../../src/app/core/configuration/model/category';
import {makeCategoryTreelist} from '../../../../../src/app/core/configuration/boot/make-category-treelist';
import {byName} from '../../../../../src/app/core/util/named';
import InputType = FieldDefinition.InputType;
import {MDInternal} from '../../../../../src/app/components/messages/md-internal';
import {categoryTreelistToMap} from '../../../../../src/app/core/configuration/category-treelist';


/**
 * @author Daniel de Oliveira
 */
describe('makeCategoriesTreelist', () => {

    it('makeCategoriesTreelist', () => {

        const A = 'A';
        const P = 'P';

        const confDef = {
            A: {
                name: A,
                parent: P,
                description: { 'de': '' },
                fields: [{ name: 'a', inputType: InputType.INPUT }]
            }, P: {
                name: P,
                description: { 'de': '' },
                fields: [{ name: 'p', inputType: InputType.INPUT }]
            }
        };

        const categoriesMap = categoryTreelistToMap(makeCategoryTreelist(confDef));

        expect(categoriesMap[P].name).toEqual(P);
        expect(categoriesMap[P].children[0].name).toEqual(A);
        expect(Category.getFields(categoriesMap[P].children[0]).length).toBe(2);

        const categoryA = categoriesMap[P].children[0];

        expect(categoryA.parentCategory.name).toBe(categoriesMap[P].name);
        expect(categoryA.name).toEqual(A);
        expect(categoryA.parentCategory.name).toBe(categoriesMap[P].name);

        const sortedFields = Category.getFields(categoryA).sort(byName);

        expect(sortedFields[0].group).toBe(Groups.CHILD);
        expect(sortedFields[1].group).toBe(Groups.PARENT);
        expect(Category.getFields(categoriesMap[P])[0].group).toBe(Groups.PARENT);
    });


    it('set all children in parent category', () => {

        const A = 'A';
        const B = 'B';
        const P = 'P';

        const confDef = {
            A: {
                name: A,
                parent: P,
                description: { 'de': '' },
                fields: []
            }, B: {
                name: B,
                parent: P,
                description: { 'de': '' },
                fields: []
            }, P: {
                name: P,
                description: { 'de': '' },
                fields: []
            }
        };

        const categoriesMap = categoryTreelistToMap(makeCategoryTreelist(confDef));
        const categoryA = categoriesMap[P].children.find(category => category.name === A)!;
        const categoryB = categoriesMap[P].children.find(category => category.name === B)!;

        expect(categoryA.parentCategory.children.length).toBe(2);
        expect(categoryB.parentCategory.children[0].name).toEqual(A);
        expect(categoryA.parentCategory.children[1].name).toEqual(B);
        expect(categoryB.parentCategory.children.length).toBe(2);
        expect(categoryB.parentCategory.children[0].name).toEqual(A);
        expect(categoryB.parentCategory.children[1].name).toEqual(B);
    });


    it('sortFields', () => {

        const T = 'T';

        const confDef = {
            T: {
                name: T,
                description: {'de': ''},
                fields: [
                    {
                        name: FieldResource.SHORTDESCRIPTION,
                        inputType: InputType.INPUT,
                        group: Groups.STEM
                    },
                    {
                        name: FieldResource.IDENTIFIER,
                        inputType: InputType.INPUT,
                        group: Groups.STEM
                    }
                ]
            }
        };

        const categoriesMap = categoryTreelistToMap(makeCategoryTreelist(confDef));

        expect(categoriesMap[T].groups[Groups.STEM].fields[0].name).toEqual(FieldResource.IDENTIFIER);
        expect(categoriesMap[T].groups[Groups.STEM].fields[1].name).toEqual(FieldResource.SHORTDESCRIPTION);
    });


    // err cases

    it('should reject a field with the same name as a parent field', () => {

        const firstLevelCategory = {
            name: 'FirstLevelCategory',
            fields: [
                {
                    name: 'fieldA',
                    label: 'Field A',
                    inputType: 'text'
                }
            ]
        };

        const secondLevelCategory = {
            name: 'SecondLevelCategory',
            parent: 'FirstLevelCategory',
            fields: [
                {
                    name: 'fieldA',
                    label: 'Field A1'
                }
            ]
        };

        expect(
            () => makeCategoryTreelist(
                {
                    FirstLevelCategory: firstLevelCategory,
                    SecondLevelCategory: secondLevelCategory
                } as any)
        ).toThrow([[
            'tried to overwrite field of parent category', 'fieldA', 'FirstLevelCategory', 'SecondLevelCategory'
        ]]);
    });


    it('should fail if parent category is not defined', () => {

        const secondLevelCategory = {
            name: 'SecondLevelCategory',
            parent: 'FirstLevelCategory',
            groups: [{
                name: 'stem',
                fields: [
                    {
                        name: 'fieldA'
                    },
                    {
                        name: 'fieldB'
                    }]
            }]
        };

        expect(() =>
            makeCategoryTreelist({ SecondLevelCategory: secondLevelCategory } as any)
        ).toThrow(MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC);
    });
});
