import { ConfigurationErrors, makeCategoryForest } from '../../../src/configuration/boot';
import { Category, FieldDefinition, FieldResource, Groups, RelationDefinition, Resource } from '../../../src/model';
import { Named, Tree } from '../../../src/tools';


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
                categoryName: A,
                parent: P,
                description: { 'de': '' },
                fields: { a: { inputType: FieldDefinition.InputType.INPUT, visible: true } },
                groups: [
                    { name: Groups.STEM, fields: ['a'] }
                ]
            }, 
            P: {
                name: P,
                categoryName: P,
                description: { 'de': '' },
                fields: { p: { inputType: FieldDefinition.InputType.INPUT, visible: true } },
                groups: [
                    { name: Groups.STEM, fields: ['p'] }
                ]
            }
        };

        const categoriesMap = Named.arrayToMap(Tree.flatten<Category>(makeCategoryForest([])(confDef)));

        expect(categoriesMap[P].name).toEqual(P);
        expect(categoriesMap[P].children[0].name).toEqual(A);
        expect(Category.getFields(categoriesMap[P].children[0]).length).toBe(3); // includes id

        const categoryA = categoriesMap[P].children[0];

        expect(categoryA.parentCategory.name).toBe(categoriesMap[P].name);
        expect(categoryA.name).toEqual(A);
        expect(categoryA.parentCategory.name).toBe(categoriesMap[P].name);
    });


   it('set all children in parent category', () => {

        const A = 'A';
        const B = 'B';
        const P = 'P';

        const confDef = {
            A: {
                name: A,
                categoryName: A,
                parent: P,
                description: { 'de': '' },
                fields: {}
            }, B: {
                name: B,
                categoryName: B,
                parent: P,
                description: { 'de': '' },
                fields: {}
            }, P: {
                name: P,
                categoryName: P,
                description: { 'de': '' },
                fields: {}
            }
        };

        const categoriesMap = Named.arrayToMap(Tree.flatten<Category>(makeCategoryForest([])(confDef)));
        const categoryA = categoriesMap[P].children.find(category => category.name === A)!;
        const categoryB = categoriesMap[P].children.find(category => category.name === B)!;

        expect(categoryA.parentCategory.children.length).toBe(2);
        expect(categoryB.parentCategory.children[0].name).toEqual(A);
        expect(categoryA.parentCategory.children[1].name).toEqual(B);
        expect(categoryB.parentCategory.children.length).toBe(2);
        expect(categoryB.parentCategory.children[0].name).toEqual(A);
        expect(categoryB.parentCategory.children[1].name).toEqual(B);
    });


    it('sort fields in groups', () => {

        const T = 'T';

        const confDef = {
            T: {
                name: T,
                categoryName: T,
                description: { 'de': '' },
                fields: {
                    shortDescription: {
                        inputType: FieldDefinition.InputType.INPUT,
                    },
                    identifier: {
                        inputType: FieldDefinition.InputType.INPUT
                    }
                },
                groups: [
                    { name: Groups.STEM, fields: ['identifier', 'relation', 'shortDescription'] }
                ]
            }
        };

        const relations: Array<RelationDefinition> = [{
            name: 'relation',
            domain: ['T'],
            range: ['X'],
            inputType: 'relation'
        }];

        const categoriesMap = Named.arrayToMap(Tree.flatten<Category>(makeCategoryForest(relations)(confDef)));

        expect(categoriesMap[T].groups[0].name).toEqual(Groups.STEM);
        expect(categoriesMap[T].groups[0].fields[0].name).toEqual(Resource.IDENTIFIER);
        expect(categoriesMap[T].groups[0].fields[1].name).toEqual('relation');
        expect(categoriesMap[T].groups[0].fields[2].name).toEqual(FieldResource.SHORTDESCRIPTION);
    });


    // err cases

    it('should reject a field with the same name as a parent field', () => {

        const firstLevelCategory = {
            name: 'FirstLevelCategory',
            categoryName: 'FirstLevelCategory',
            fields: {
                fieldA: {
                    label: 'Field A',
                    inputType: 'text',
                    visible: true
                }
            }
        };

        const secondLevelCategory = {
            name: 'SecondLevelCategory',
            categoryName: 'SecondLevelCategory',
            parent: 'FirstLevelCategory',
            fields: {
                fieldA: {
                    label: 'Field A1',
                    visible: true
                }
            }
        };

        expect(
            () => makeCategoryForest([])(
                {
                    FirstLevelCategory: firstLevelCategory,
                    SecondLevelCategory: secondLevelCategory
                } as any)
        ).toThrow([[
            ConfigurationErrors.TRIED_TO_OVERWRITE_PARENT_FIELD, 'fieldA', 'FirstLevelCategory', 'SecondLevelCategory'
        ]]);
    });


    xit('should not pass if parent category is not defined', () => {

        const secondLevelCategory = {
            name: 'SecondLevelCategory',
            categoryName: 'SecondLevelCategory',
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

        // expect(() => TODO reenable
            // makeCategoryForest({ SecondLevelCategory: secondLevelCategory } as any)
        // ).toThrow(MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC);
    });
});
