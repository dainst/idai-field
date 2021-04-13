import {FieldResource, Tree, Groups, FieldDefinition, Category} from 'idai-field-core';
import {makeCategoryForest} from '../../../../../src/app/core/configuration/boot/make-category-forest';
import {Named} from 'idai-field-core';
import InputType = FieldDefinition.InputType;
import {MDInternal} from '../../../../../src/app/components/messages/md-internal';
import {ConfigurationErrors} from '../../../../../src/app/core/configuration/boot/configuration-errors';


/**
 * @author Daniel de Oliveira
 */
describe('makeCategoriesForest', () => {

    it('makeCategoriesForest', () => {

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

        const categoriesMap = Named.arrayToMap(Tree.flatten<Category>(makeCategoryForest(confDef)));

        expect(categoriesMap[P].name).toEqual(P);
        expect(categoriesMap[P].children[0].name).toEqual(A);
        expect(Category.getFields(categoriesMap[P].children[0]).length).toBe(2);

        const categoryA = categoriesMap[P].children[0];

        expect(categoryA.parentCategory.name).toBe(categoriesMap[P].name);
        expect(categoryA.name).toEqual(A);
        expect(categoryA.parentCategory.name).toBe(categoriesMap[P].name);

        const sortedFields = Category.getFields(categoryA).sort(Named.byName);

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

        const categoriesMap = Named.arrayToMap(Tree.flatten<Category>(makeCategoryForest(confDef)));
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

        const categoriesMap = Named.arrayToMap(Tree.flatten<Category>(makeCategoryForest(confDef)));

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
            () => makeCategoryForest(
                {
                    FirstLevelCategory: firstLevelCategory,
                    SecondLevelCategory: secondLevelCategory
                } as any)
        ).toThrow([[
            ConfigurationErrors.TRIED_TO_OVERWRITE_PARENT_FIELD, 'fieldA', 'FirstLevelCategory', 'SecondLevelCategory'
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
            makeCategoryForest({ SecondLevelCategory: secondLevelCategory } as any)
        ).toThrow(MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC);
    });
});
