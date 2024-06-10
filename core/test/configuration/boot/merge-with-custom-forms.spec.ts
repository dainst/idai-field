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
                        { name: 'group1', fields: ['f1'] }
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
                    { name: 'group1', fields: ['c1'] }
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
                    { name: 'group1', fields: ['f2', 'f3'] }
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


    it('extend category directly - inherit custom fields using minimal forms', () => {

        const f1: Field = { name: 'f1', inputType: Field.InputType.TEXT };
        const f2: Field = { name: 'f2', inputType: Field.InputType.BOOLEAN }
        const f3: Field = { name: 'f3', inputType: Field.InputType.UNSIGNEDINT };
        const f4: Field = { name: 'f4', inputType: Field.InputType.UNSIGNEDFLOAT };

        const categories = {
            A: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                description: {},
                fields: { f1 },
                minimalForm: {
                    groups: [
                        { name: 'group1', fields: ['f1'] }
                    ]
                }
            },
            B: {
                parent: 'A',
                description: {},
                fields: { f2 },
                minimalForm: {
                    groups: [
                        { name: 'group1', fields: ['f2'] }
                    ]
                }
            }
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
                    { name: 'group1', fields: ['f1'] }
                ]
            },
            B: {
                name: 'B',
                categoryName: 'B',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                description: {},
                fields: { f1, f2 },
                groups: [
                    { name: 'group1', fields: ['f1', 'f2'] }
                ]
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            B: {
                fields: { f4 },
                groups: [
                    { name: 'group1', fields: ['f1', 'f2', 'f3', 'f4'] }
                ]
            },
            A: {
                fields: { f3 },
                groups: [
                    { name: 'group1', fields: ['f1', 'f3'] }
                ]
            }
        };

        const result = mergeWithCustomForms(customForms, categories as any, {}, {}, [],
            Object.keys(customForms))(forms);

        expect(Object.keys(result['A'].fields).length).toBe(2);
        expect(result['A'].fields['f1'].inputType).toEqual(Field.InputType.TEXT);
        expect(result['A'].fields['f3'].inputType).toEqual(Field.InputType.UNSIGNEDINT);
        expect(result['A'].customFields).toEqual(['f3']);

        expect(Object.keys(result['B'].fields).length).toBe(4);
        expect(result['B'].fields['f1'].inputType).toEqual(Field.InputType.TEXT);
        expect(result['B'].fields['f2'].inputType).toEqual(Field.InputType.BOOLEAN);
        expect(result['B'].fields['f3'].inputType).toEqual(Field.InputType.UNSIGNEDINT);
        expect(result['B'].fields['f4'].inputType).toEqual(Field.InputType.UNSIGNEDFLOAT);
        expect(result['B'].customFields).toEqual(['f3', 'f4']);
    });


    it('extend category directly - inherit custom fields using library forms', () => {

        const f1: Field = { name: 'f1', inputType: Field.InputType.TEXT };
        const f2: Field = { name: 'f2', inputType: Field.InputType.BOOLEAN }
        const f3: Field = { name: 'f3', inputType: Field.InputType.UNSIGNEDINT };
        const f4: Field = { name: 'f4', inputType: Field.InputType.UNSIGNEDFLOAT };

        const categories = {
            A: {
                description: {},
                fields: { f1 },
                minimalForm: {
                    groups: []
                }
            },
            B: {
                parent: 'A',
                description: {},
                fields: { f2 },
                minimalForm: {
                    groups: []
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
                fields: {},
                groups: []
            },
            'A:default': {
                name: 'A:default',
                categoryName: 'A',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                description: {},
                fields: { f1 },
                groups: [
                    { name: 'group1', fields: ['f1'] }
                ]
            },
            B: {
                name: 'B',
                categoryName: 'B',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                description: {},
                fields: {},
                groups: []
            },
            'B:default': {
                name: 'B:default',
                categoryName: 'B',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                description: {},
                fields: { f1, f2 },
                groups: [
                    { name: 'group1', fields: ['f1', 'f2'] }
                ]
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'B:default': {
                fields: { f4 },
                groups: [
                    { name: 'group1', fields: ['f1', 'f2', 'f3', 'f4'] }
                ]
            },
            'A:default': {
                fields: { f3 },
                groups: [
                    { name: 'group1', fields: ['f1', 'f3'] }
                ]
            }
        };

        const result = mergeWithCustomForms(customForms, categories as any, {}, {}, [],
            Object.keys(customForms))(forms);

        expect(Object.keys(result['A'].fields).length).toBe(0);
        expect(Object.keys(result['B'].fields).length).toBe(0);

        expect(Object.keys(result['A:default'].fields).length).toBe(2);
        expect(result['A:default'].fields['f1'].inputType).toEqual(Field.InputType.TEXT);
        expect(result['A:default'].fields['f3'].inputType).toEqual(Field.InputType.UNSIGNEDINT);
        expect(result['A:default'].customFields).toEqual(['f3']);

        expect(Object.keys(result['B:default'].fields).length).toBe(4);
        expect(result['B:default'].fields['f1'].inputType).toEqual(Field.InputType.TEXT);
        expect(result['B:default'].fields['f2'].inputType).toEqual(Field.InputType.BOOLEAN);
        expect(result['B:default'].fields['f3'].inputType).toEqual(Field.InputType.UNSIGNEDINT);
        expect(result['B:default'].fields['f4'].inputType).toEqual(Field.InputType.UNSIGNEDFLOAT);
        expect(result['B:default'].customFields).toEqual(['f3', 'f4']);
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
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
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
                        { name: 'group1', fields: ['f1'] }
                    ]
                }
            }
        };

        const forms: Map<TransientFormDefinition> = {
            A: {
                name: 'A',
                categoryName: 'A',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                description: {},
                fields: {},
                groups: [
                    { name: 'group1', fields: ['f1'] }
                ]
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            A: {
                fields: {}
            },
            NewCategory: {
                parent: 'A',
                fields: {
                    f3: {
                        inputType: Field.InputType.LITERATURE
                    }
                },
                groups: [
                    { name: 'group1', fields: ['c1', 'f2', 'f3'] }
                ]
            }
        };

        const result = mergeWithCustomForms(customForms, categories as any, {}, commonFields, [],
            Object.keys(customForms))(forms);

        expect(result['A'].customFields).toEqual([]);

        expect(Object.keys(result['NewCategory'].fields).length).toBe(4);
        expect(result['NewCategory'].fields['f1'].inputType).toEqual(Field.InputType.TEXT);
        expect(result['NewCategory'].fields['f2'].inputType).toEqual(Field.InputType.BOOLEAN);
        expect(result['NewCategory'].fields['f3'].inputType).toEqual(Field.InputType.LITERATURE);
        expect(result['NewCategory'].fields['c1'].inputType).toEqual(Field.InputType.INPUT);
        expect(result['NewCategory'].customFields).toEqual(['c1', 'f2', 'f3']);
    });


    it('inherit valuelists', () => {

        const categories = {
            A: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                description: {},
                fields: {
                    f1: {
                        name: 'f1',
                        inputType: Field.InputType.RADIO,
                        valuelistId: 'library-valuelist' 
                    }
                },
                minimalForm: {
                    groups: [
                        { name: 'group1', fields: ['f1'] }
                    ]
                }
            }
        };

        const forms: Map<TransientFormDefinition> = {
            A: {
                name: 'A',
                categoryName: 'A',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                description: {},
                fields: {},
                groups: [
                    { name: 'group1', fields: ['f1'] }
                ]
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            A: {
                valuelists: { f1: 'custom-valuelist' },
                fields: {},
                groups: [
                    { name: 'group1', fields: ['f1'] }
                ]
            },
            NewCategory: {
                parent: 'A',
                fields: {},
                groups: [
                    { name: 'group1', fields: ['f1'] }
                ]
            }
        };

        const result = mergeWithCustomForms(customForms, categories as any, {}, {}, [],
            Object.keys(customForms))(forms);

        expect(result['A'].valuelists['f1']).toEqual('custom-valuelist');
        expect(result['NewCategory'].valuelists['f1']).toEqual('custom-valuelist');
    });


    it('merge hidden arrays', () => {

        const categories = {
            A: {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                description: {},
                fields: {
                    f1: {
                        name: 'f1',
                        inputType: Field.InputType.INPUT
                    },
                    f2: {
                        name: 'f1',
                        inputType: Field.InputType.INPUT
                    }
                },
                minimalForm: {
                    groups: [
                        { name: 'group1', fields: ['f1', 'f2'] }
                    ]
                }
            },
            B: {
                parent: 'A',
                description: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const forms: Map<TransientFormDefinition> = {
            A: {
                name: 'A',
                categoryName: 'A',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                description: {},
                fields: {},
                groups: [
                    { name: 'group1', fields: ['f1', 'f2'] }
                ]
            },
            B: {
                name: 'B',
                categoryName: 'B',
                parent: 'A',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                description: {},
                fields: {},
                groups: [
                    { name: 'group1', fields: ['f1', 'f2'] }
                ]
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            A: {
                fields: {},
                hidden: ['f1'],
                groups: [
                    { name: 'group1', fields: ['f1', 'f2'] }
                ]
            },
            B: {
                fields: {},
                hidden: ['f2'],
                groups: [
                    { name: 'group1', fields: ['f1', 'f2'] }
                ]
            },
            NewCategory: {
                parent: 'A',
                fields: {},
                hidden: ['f2'],
                groups: [
                    { name: 'group1', fields: ['f1', 'f2'] }
                ]
            }
        };

        const result = mergeWithCustomForms(customForms, categories as any, {}, {}, [],
            Object.keys(customForms))(forms);

        expect(result['A'].hidden).toEqual(['f1']);
        expect(result['B'].hidden).toEqual(['f1', 'f2']);
        expect(result['NewCategory'].hidden).toEqual(['f1', 'f2']);
    });
});
