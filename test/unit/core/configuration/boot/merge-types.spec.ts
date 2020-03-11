import {Map} from 'tsfun';
import {mergeTypes} from '../../../../../app/core/configuration/boot/merge-types';
import {CustomTypeDefinition} from '../../../../../app/core/configuration/model/custom-type-definition';
import {FieldDefinition} from '../../../../../app/core/configuration/model/field-definition';
import {TransientTypeDefinition} from '../../../../../app/core/configuration/model/transient-type-definition';


describe('mergeTypes', () => {

    it('extend type directly - inherit a field and add a field', () => {

        const selectableTypes: Map<TransientTypeDefinition> = {
            'A:default': {
                typeFamily: 'A',
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

        const customTypes: Map<CustomTypeDefinition> = {
            'A:default': {
                fields: {
                    f2: {
                        inputType: FieldDefinition.InputType.INPUT
                    }
                }
            }
        };

        const result = mergeTypes(customTypes, () => true)(selectableTypes);
        expect(result['A:default'].fields['f1'].inputType).toEqual(FieldDefinition.InputType.INPUT);
        expect(result['A:default'].fields['f2'].inputType).toEqual(FieldDefinition.InputType.INPUT);
    });


    it('extend parent type - inherit a field and add a field', () => {

        const selectableTypes: Map<TransientTypeDefinition> = {
            'A:default': {
                typeFamily: 'A',
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

        const customTypes: Map<CustomTypeDefinition> = {
            'A:child': {
                parent: 'A:default',
                fields: {
                    f2: {
                        inputType: FieldDefinition.InputType.INPUT
                    }
                }
            }
        };

        const result = mergeTypes(customTypes, () => true)(selectableTypes);
        expect(result['A:default'].fields['f1'].inputType).toEqual(FieldDefinition.InputType.INPUT);
        expect(result['A:child'].fields['f2'].inputType).toEqual(FieldDefinition.InputType.INPUT);
    });
});