import { Map } from 'tsfun';
import { CustomFormDefinition, mergeWithCustomForms, TransientFormDefinition } from '../../../src/configuration';
import { Field } from '../../../src/model';


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

        const result = mergeWithCustomForms(customForms, categories as any, {}, commonFields, [])(forms);

        expect(Object.keys(result['A:default'].fields).length).toBe(4);
        expect(result['A:default'].fields['f1'].inputType).toEqual(Field.InputType.TEXT);
        expect(result['A:default'].fields['f2'].inputType).toEqual(Field.InputType.BOOLEAN);
        expect(result['A:default'].fields['f3'].inputType).toEqual(Field.InputType.LITERATURE);
        expect(result['A:default'].fields['c1'].inputType).toEqual(Field.InputType.INPUT);
        expect(result['A:default'].hidden).toEqual(['f1']);
        expect(result['A:default'].customFields).toEqual(['f2', 'f3']);
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

        const result = mergeWithCustomForms(customForms, categories as any, {}, commonFields, [])({});

        expect(Object.keys(result['NewCategory'].fields).length).toBe(4);
        expect(result['NewCategory'].fields['f1'].inputType).toEqual(Field.InputType.TEXT);
        expect(result['NewCategory'].fields['f2'].inputType).toEqual(Field.InputType.BOOLEAN);
        expect(result['NewCategory'].fields['f3'].inputType).toEqual(Field.InputType.LITERATURE);
        expect(result['NewCategory'].fields['c1'].inputType).toEqual(Field.InputType.INPUT);
        expect(result['NewCategory'].customFields).toEqual(['c1', 'f2', 'f3']);
    });
});
