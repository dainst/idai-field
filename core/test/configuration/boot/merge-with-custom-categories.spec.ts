import { Map } from 'tsfun';
import { mergeWithCustomCategories } from '../../../src/configuration/boot';
import { CustomCategoryDefinition, TransientCategoryDefinition } from '../../../src/configuration/model';
import { FieldDefinition } from '../../../src/model';


describe('mergeWithCustomCategories', () => {

    it('extend category directly - inherit a field and add a field', () => {

        const selectableCategories: Map<TransientCategoryDefinition> = {
            'A:default': {
                name: 'A:default',
                categoryName: 'A',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                commons: [],
                description: {},
                fields: {
                    f1: {
                        name: 'f1',
                        inputType: FieldDefinition.InputType.INPUT
                    }
                },
                groups: []
            }
        };

        const customCategories: Map<CustomCategoryDefinition> = {
            'A:default': {
                fields: {
                    f2: {
                        inputType: FieldDefinition.InputType.INPUT
                    }
                }
            }
        };

        const result = mergeWithCustomCategories(customCategories, () => true)(selectableCategories);
        expect(result['A:default'].fields['f1'].inputType).toEqual(FieldDefinition.InputType.INPUT);
        expect(result['A:default'].fields['f2'].inputType).toEqual(FieldDefinition.InputType.INPUT);
    });


    it('extend parent category - inherit a field and add a field', () => {

        const selectableCategories: Map<TransientCategoryDefinition> = {
            'A:default': {
                name: 'A:default',
                categoryName: 'A',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                commons: [],
                description: {},
                fields: {
                    f1: {
                        name: 'f1',
                        inputType: FieldDefinition.InputType.INPUT
                    }
                },
                groups: []
            }
        };

        const customCategories: Map<CustomCategoryDefinition> = {
            'A:child': {
                parent: 'A:default',
                fields: {
                    f2: {
                        inputType: FieldDefinition.InputType.INPUT
                    }
                }
            }
        };

        const result = mergeWithCustomCategories(customCategories, () => true)(selectableCategories);
        expect(result['A:default'].fields['f1'].inputType).toEqual(FieldDefinition.InputType.INPUT);
        expect(result['A:child'].fields['f2'].inputType).toEqual(FieldDefinition.InputType.INPUT);
    });


    it('merge commons', () => {

        const selectableCategories: Map<TransientCategoryDefinition> = {
            'A:default': {
                name: 'A:default',
                categoryName: 'A',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                commons: ['a'],
                description: {},
                fields: {
                    f1: {
                        name: 'f1',
                        inputType: FieldDefinition.InputType.INPUT
                    }
                },
                groups: []
            }
        };

        const customCategories: Map<CustomCategoryDefinition> = {
            'A:default': {
                commons: ['b'],
                fields: {}
            }
        };

        const result = mergeWithCustomCategories(customCategories, () => true)(selectableCategories);
        expect(result['A:default'].commons).toEqual(['a', 'b']);
    });
});
