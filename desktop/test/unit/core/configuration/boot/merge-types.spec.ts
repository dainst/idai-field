import {Map} from 'tsfun';
import {mergeCategories} from '../../../../../src/app/core/configuration/boot/merge-categories';
import {CustomCategoryDefinition} from '../../../../../src/app/core/configuration/model/custom-category-definition';
import {FieldDefinition} from 'idai-field-core';
import {TransientCategoryDefinition} from '../../../../../src/app/core/configuration/model/transient-category-definition';


describe('mergeCategories', () => {

    it('extend category directly - inherit a field and add a field', () => {

        const selectableCategories: Map<TransientCategoryDefinition> = {
            'A:default': {
                categoryName: 'A',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                commons: [],
                description: {},
                fields: {
                    f1: {
                        inputType: FieldDefinition.InputType.INPUT
                    }
                }
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

        const result = mergeCategories(customCategories, () => true)(selectableCategories);
        expect(result['A:default'].fields['f1'].inputType).toEqual(FieldDefinition.InputType.INPUT);
        expect(result['A:default'].fields['f2'].inputType).toEqual(FieldDefinition.InputType.INPUT);
    });


    it('extend parent category - inherit a field and add a field', () => {

        const selectableCategories: Map<TransientCategoryDefinition> = {
            'A:default': {
                categoryName: 'A',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                commons: [],
                description: {},
                fields: {
                    f1: {
                        inputType: FieldDefinition.InputType.INPUT
                    }
                }
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

        const result = mergeCategories(customCategories, () => true)(selectableCategories);
        expect(result['A:default'].fields['f1'].inputType).toEqual(FieldDefinition.InputType.INPUT);
        expect(result['A:child'].fields['f2'].inputType).toEqual(FieldDefinition.InputType.INPUT);
    });


    it('merge commons', () => {

        const selectableCategories: Map<TransientCategoryDefinition> = {
            'A:default': {
                categoryName: 'A',
                valuelists: {},
                creationDate: '',
                createdBy: '',
                commons: ['a'],
                description: {},
                fields: {
                    f1: {
                        inputType: FieldDefinition.InputType.INPUT
                    }
                }
            }
        };

        const customCategories: Map<CustomCategoryDefinition> = {
            'A:default': {
                commons: ['b'],
                fields: {}
            }
        };

        const result = mergeCategories(customCategories, () => true)(selectableCategories);
        expect(result['A:default'].commons).toEqual(['a', 'b']);
    });
});
