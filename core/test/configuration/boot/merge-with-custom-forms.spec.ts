import { Map } from 'tsfun';
import { mergeWithCustomForms } from '../../../src/configuration/boot/merge-with-custom-forms';
import { CustomFormDefinition } from '../../../src/configuration/model/form/custom-form-definition';
import { TransientFormDefinition } from '../../../src/configuration/model/form/transient-form-definition';
import { Field } from '../../../src/model/configuration/field';


describe('mergeWithCustomForms', () => {

    it('extend category directly - inherit and add fields', () => {

        const commonFields: Map<Field> = {
            c1: {
                name: 'c1',
                inputType: Field.InputType.INPUT
            }
        };

        const categories = {
            A: {
                description: {},
                fields: {
                    f1: {
                        name: 'f1',
                        inputType: Field.InputType.TEXT
                    },
                    f2: {
                        name: 'f2',
                        inputType: Field.InputType.BOOLEAN
                    }
                },
                minimalForm: {
                    groups: [
                        { name: 'group1', fields: ['f1'] }
                    ]
                }
            }
        };

        const forms: Map<TransientFormDefinition> = {
            'A:default': {
                name: 'A:default',
                categoryName: 'A',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                description: {},
                fields: {},
                groups: [
                    { name: 'group1', fields: ['c1'] }
                ]
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A:default': {
                hidden: ['f1'],
                fields: {
                    f3: {
                        inputType: Field.InputType.LITERATURE
                    }
                },
                groups: [
                    { name: 'group1', fields: ['f2', 'f3'] }
                ]
            }
        };

        const result = mergeWithCustomForms(customForms, categories as any, {}, commonFields, [],
            Object.keys(customForms))(forms);

        expect(Object.keys(result['A:default'].fields).length).toBe(4);
        expect(result['A:default'].fields['f1'].inputType).toEqual(Field.InputType.TEXT);
        expect(result['A:default'].fields['f2'].inputType).toEqual(Field.InputType.BOOLEAN);
        expect(result['A:default'].fields['f3'].inputType).toEqual(Field.InputType.LITERATURE);
        expect(result['A:default'].fields['c1'].inputType).toEqual(Field.InputType.INPUT);
        expect(result['A:default'].hidden).toEqual(['f1']);
        expect(result['A:default'].customFields).toEqual(['f2', 'f3']);
    });


    it('extend category directly - inherit custom fields', () => {

        const f1: Field = { name: 'f1', inputType: Field.InputType.TEXT };
        const f2: Field = { name: 'f2', inputType: Field.InputType.BOOLEAN }
        const f3: Field = { name: 'f3', inputType: Field.InputType.UNSIGNEDINT };
        const f4: Field = { name: 'f4', inputType: Field.InputType.UNSIGNEDFLOAT };
        const f5: Field = { name: 'f5', inputType: Field.InputType.LITERATURE };
        const f6: Field = { name: 'f6', inputType: Field.InputType.INPUT };
        const f7: Field = { name: 'f7', inputType: Field.InputType.CATEGORY };

        const categories = {
            A: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                description: {},
                fields: { f1 },
                minimalForm: {
                    groups: [
                        { name: 'group1', fields: ['f1'] }
                    ]
                }
            },
            B: {
                parent: 'A',
                description: {},
                fields: { f2 },
                minimalForm: {
                    groups: [
                        { name: 'group1', fields: ['f2'] }
                    ]
                }
            },
            C: {
                description: {},
                fields: {},
                minimalForm: {
                    groups: []
                }
            },
            D: {
                parent: 'C',
                description: {},
                fields: { f3 },
                minimalForm: {
                    groups: [
                        { name: 'group1', fields: ['f3'] }
                    ]
                }
            },
        };

        const forms: Map<TransientFormDefinition> = {
            A: {
                name: 'A',
                categoryName: 'A',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                description: {},
                fields: { f1 },
                groups: [
                    { name: 'group1', fields: ['f1'] }
                ]
            },
            B: {
                name: 'B',
                categoryName: 'B',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                description: {},
                fields: { f2 },
                groups: [
                    { name: 'group1', fields: ['f2'] }
                ]
            },
            C: {
                name: 'C',
                categoryName: 'C',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                description: {},
                fields: {},
                groups: []
            },
            'C:default': {
                name: 'C:default',
                categoryName: 'C',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                description: {},
                fields: {},
                groups: []
            },
            D: {
                name: 'D',
                categoryName: 'D',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                description: {},
                fields: {},
                groups: []
            },
            'D:default': {
                name: 'D:default',
                categoryName: 'D',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                description: {},
                fields: { f3 },
                groups: [
                    { name: 'group1', fields: ['f3'] }
                ]
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            B: {
                fields: { f6 },
                groups: [
                    { name: 'group1', fields: ['f1', 'f2', 'f5', 'f6'] }
                ]
            },
            'D:default': {
                fields: { f7 },
                groups: [
                    { name: 'group1', fields: ['f3', 'f4', 'f7'] }
                ]
            },
            A: {
                fields: { f5 },
                groups: [
                    { name: 'group1', fields: ['f1', 'f5'] }
                ]
            },
            'C:default': {
                fields: { f4 },
                groups: [
                    { name: 'group1', fields: ['f4'] }
                ]
            }
        };

        const result = mergeWithCustomForms(customForms, categories as any, {}, {}, [],
            Object.keys(customForms))(forms);

        expect(Object.keys(result['A'].fields).length).toBe(2);
        expect(result['A'].fields['f1'].inputType).toEqual(Field.InputType.TEXT);
        expect(result['A'].fields['f5'].inputType).toEqual(Field.InputType.LITERATURE);
        expect(result['A'].customFields).toEqual(['f5']);

        expect(Object.keys(result['B'].fields).length).toBe(4);
        expect(result['B'].fields['f1'].inputType).toEqual(Field.InputType.TEXT);
        expect(result['B'].fields['f2'].inputType).toEqual(Field.InputType.BOOLEAN);
        expect(result['B'].fields['f5'].inputType).toEqual(Field.InputType.LITERATURE);
        expect(result['B'].fields['f6'].inputType).toEqual(Field.InputType.INPUT);
        
        // TODO Enable
        // expect(result['B'].customFields).toEqual(['f5', 'f6']);

        expect(Object.keys(result['C'].fields).length).toBe(0);
        expect(Object.keys(result['D'].fields).length).toBe(0);

        expect(Object.keys(result['C:default'].fields).length).toBe(1);
        expect(result['C:default'].fields['f4'].inputType).toEqual(Field.InputType.UNSIGNEDFLOAT);
        expect(result['C:default'].customFields).toEqual(['f4']);

        expect(Object.keys(result['D:default'].fields).length).toBe(3);
        expect(result['D:default'].fields['f3'].inputType).toEqual(Field.InputType.UNSIGNEDINT);
        expect(result['D:default'].fields['f4'].inputType).toEqual(Field.InputType.UNSIGNEDFLOAT);
        expect(result['D:default'].fields['f7'].inputType).toEqual(Field.InputType.CATEGORY);
        expect(result['D:default'].customFields).toEqual(['f4', 'f7']);
    });


    it('extend parent category - inherit and add fields', () => {

        const commonFields: Map<Field> = {
            c1: {
                name: 'c1',
                inputType: Field.InputType.INPUT
            }
        };

        const categories = {
            A: {
                description: {},
                fields: {
                    f1: {
                        name: 'f1',
                        inputType: Field.InputType.TEXT
                    },
                    f2: {
                        name: 'f2',
                        inputType: Field.InputType.BOOLEAN
                    }
                },
                minimalForm: {
                    groups: [
                        { name: 'group1', fields: ['f1'] }
                    ]
                }
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'NewCategory': {
                parent: 'A',
                fields: {
                    f3: {
                        inputType: Field.InputType.LITERATURE
                    }
                },
                groups: [
                    { name: 'group1', fields: ['c1', 'f2', 'f3'] }
                ]
            }
        };

        const result = mergeWithCustomForms(customForms, categories as any, {}, commonFields, [],
            Object.keys(customForms))({});

        expect(Object.keys(result['NewCategory'].fields).length).toBe(4);
        expect(result['NewCategory'].fields['f1'].inputType).toEqual(Field.InputType.TEXT);
        expect(result['NewCategory'].fields['f2'].inputType).toEqual(Field.InputType.BOOLEAN);
        expect(result['NewCategory'].fields['f3'].inputType).toEqual(Field.InputType.LITERATURE);
        expect(result['NewCategory'].fields['c1'].inputType).toEqual(Field.InputType.INPUT);
        expect(result['NewCategory'].customFields).toEqual(['c1', 'f2', 'f3']);
    });
});
