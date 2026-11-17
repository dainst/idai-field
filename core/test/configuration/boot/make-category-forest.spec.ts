import { Map } from 'tsfun';
import { makeCategoryForest } from '../../../src/configuration/boot/make-category-forest';
import { TransientCategoryDefinition } from '../../../src/configuration/model/category/transient-category-definition';
import { TransientFormDefinition } from '../../../src/configuration/model/form/transient-form-definition';
import { CategoryForm } from '../../../src/model/configuration/category-form';
import { Field } from '../../../src/model/configuration/field';
import { Groups } from '../../../src/model/configuration/group';
import { Relation } from '../../../src/model/configuration/relation';
import { FieldResource } from '../../../src/model/document/field-resource';
import { Resource } from '../../../src/model/document/resource';
import { Tree } from '../../../src/tools/forest';
import { Named } from '../../../src/tools/named';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('makeCategoryForest', () => {

    it('makeCategoryForest', () => {

        const A = 'A';
        const P = 'P';

        const categories: Map<TransientCategoryDefinition> = {
            A: {
                name: A,
                parent: P,
                fields: { a: { name: 'a', inputType: Field.InputType.INPUT, visible: true } },
                description: {},
                minimalForm: { groups: [] } as TransientFormDefinition
            }, 
            P: {
                name: P,
                fields: { p: { name: 'p', inputType: Field.InputType.INPUT, visible: true } },
                description: {},
                minimalForm: { groups: [] } as TransientFormDefinition
            }
        };

        const forms: Map<TransientFormDefinition> = {
            'A:default': {
                name: 'A:default',
                categoryName: A,
                description: {},
                createdBy: '',
                creationDate: '',
                fields: {
                    a: { name: 'a', inputType: Field.InputType.INPUT, visible: true },
                    p: { name: 'p', inputType: Field.InputType.INPUT, visible: true }
                },
                groups: [
                    { name: Groups.STEM, fields: ['a', 'p'] }
                ]
            }, 
            'P:default': {
                name: 'P:default',
                categoryName: P,
                description: {},
                createdBy: '',
                creationDate: '',
                fields: {
                    p: { name: 'p', inputType: Field.InputType.INPUT, visible: true }
                },
                groups: [
                    { name: Groups.STEM, fields: ['p'] }
                ]
            }
        };

        const categoriesMap = Named.arrayToMap(Tree.flatten<CategoryForm>(makeCategoryForest([], categories)(forms)));

        expect(categoriesMap[P].name).toEqual(P);
        expect(categoriesMap[P].children[0].name).toEqual(A);
        expect(CategoryForm.getFields(categoriesMap[P]).length).toBe(1);

        const categoryA = categoriesMap[P].children[0];
        
        expect(categoryA.name).toEqual(A);
        expect(CategoryForm.getFields(categoryA).length).toBe(2);
        expect(categoryA.parentCategory.name).toBe(categoriesMap[P].name);
    });


   it('set all children in parent category', () => {

        const A = 'A';
        const B = 'B';
        const P = 'P';

        const categories: Map<TransientCategoryDefinition> = {
            A: {
                name: A,
                parent: P,
                fields: {},
                description: {},
                minimalForm: { groups: [] } as TransientFormDefinition
            }, P: {
                name: P,
                fields: {},
                description: {},
                minimalForm: { groups: [] } as TransientFormDefinition
            }
        };

        const forms: Map<TransientFormDefinition> = {
            'A:default': {
                name: 'A:default',
                categoryName: A,
                createdBy: '',
                creationDate: '',
                description: {},
                fields: {},
                groups: []
            },
            B: {  // New category from custom configuration
                name: B,
                categoryName: B,
                parent: P,
                createdBy: '',
                creationDate: '',
                description: {},
                fields: {},
                groups: []
            },
            'P:default': {
                name: 'P:default',
                categoryName: P,
                createdBy: '',
                creationDate: '',
                description: {},
                fields: {},
                groups: []
            }
        };

        const categoriesMap = Named.arrayToMap(Tree.flatten<CategoryForm>(makeCategoryForest([], categories)(forms)));
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

        const categories: Map<TransientCategoryDefinition> = {
            T: {
                name: T,
                description: {},
                fields: {
                    shortDescription: {
                        name: 'shortDescription',
                        inputType: Field.InputType.INPUT,
                    },
                    identifier: {
                        name: 'identifier',
                        inputType: Field.InputType.INPUT
                    }
                },
                minimalForm: { groups: [] } as TransientFormDefinition
            }
        };

        const forms: Map<TransientFormDefinition> = {
            'T:default': {
                name: 'T:default',
                categoryName: T,
                description: {},
                createdBy: '',
                creationDate: '',
                fields: {
                    shortDescription: {
                        name: 'shortDescription',
                        inputType: Field.InputType.INPUT,
                    },
                    identifier: {
                        name: 'identifier',
                        inputType: Field.InputType.INPUT
                    }
                },
                groups: [
                    { name: Groups.STEM, fields: ['identifier', 'relation', 'shortDescription'] }
                ]
            }
        };

        const relations: Array<Relation> = [{
            name: 'relation',
            domain: ['T'],
            range: ['X'],
            inputType: 'relation'
        }];

        const categoriesMap = Named.arrayToMap(
            Tree.flatten<CategoryForm>(makeCategoryForest(relations, categories)(forms))
        );

        expect(categoriesMap[T].groups[0].name).toEqual(Groups.STEM);
        expect(categoriesMap[T].groups[0].fields[0].name).toEqual(Resource.IDENTIFIER);
        expect(categoriesMap[T].groups[0].fields[1].name).toEqual('relation');
        expect(categoriesMap[T].groups[0].fields[2].name).toEqual(FieldResource.SHORTDESCRIPTION);
    });


    it('put unassigned fields to default groups', () => {

        const categories: Map<TransientCategoryDefinition> = {
            T: {
                name: 'T',
                description: {},
                fields: {
                    field1: {
                        name: 'field1',
                        inputType: Field.InputType.INPUT
                    }
                },
                minimalForm: {
                    groups: [
                        { name: Groups.STEM, fields: ['field1'] }
                    ]
                } as TransientFormDefinition
            }
        };

        const forms: Map<TransientFormDefinition> = {
            'T:default': {
                name: 'T:default',
                categoryName: 'T',
                description: {},
                createdBy: '',
                creationDate: '',
                fields: {
                    field1: {
                        name: 'field1',
                        inputType: Field.InputType.INPUT,
                        visible: true
                    },
                    field2: {
                        name: 'field2',
                        inputType: Field.InputType.INPUT,
                        visible: true
                    }
                },
                groups: [
                    { name: Groups.STEM, fields: ['field2'] }
                ]
            }
        };

        const relations: Array<Relation> = [{
            name: 'isBefore',
            domain: ['T'],
            range: ['X'],
            inputType: 'relation'
        }];

        const categoriesMap = Named.arrayToMap(
            Tree.flatten<CategoryForm>(makeCategoryForest(relations, categories)(forms))
        );

        expect(categoriesMap['T'].groups.length).toBe(3);
        expect(categoriesMap['T'].groups[0].name).toEqual(Groups.STEM);
        expect(categoriesMap['T'].groups[0].fields.length).toBe(1);
        expect(categoriesMap['T'].groups[0].fields[0].name).toEqual('field2');
        expect(categoriesMap['T'].groups[1].name).toEqual(Groups.OTHER);
        expect(categoriesMap['T'].groups[1].fields.length).toBe(1);
        expect(categoriesMap['T'].groups[1].fields[0].name).toEqual('field1');
        expect(categoriesMap['T'].groups[2].name).toEqual(Groups.TIME);
        expect(categoriesMap['T'].groups[2].fields.length).toBe(1);
        expect(categoriesMap['T'].groups[2].fields[0].name).toEqual('isBefore');
    });
});
