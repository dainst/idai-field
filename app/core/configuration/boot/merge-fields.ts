import {Map} from 'tsfun';
import {TransientFieldDefinition} from '../model/transient-category-definition';


export function mergeFields(target: Map<TransientFieldDefinition>, source: Map<TransientFieldDefinition>) {

    for (let sourceFieldName of Object.keys(source)) {
        let alreadyPresentInTarget = false;
        for (let targetFieldName of Object.keys(target)) {
            if (targetFieldName === sourceFieldName) alreadyPresentInTarget = true;
        }
        if (!alreadyPresentInTarget) {
            target[sourceFieldName] = source[sourceFieldName];
        } else {
            // at the moment, this is allowed for custom name fields, see also issueWarningOnFieldTypeChanges
            if (source[sourceFieldName].inputType) {
                target[sourceFieldName].inputType = source[sourceFieldName].inputType;
            }
            if (source[sourceFieldName].valuelistId) {
                target[sourceFieldName].valuelistId = source[sourceFieldName].valuelistId;
            }
            if (source[sourceFieldName].valuelistFromProjectField) {
                target[sourceFieldName].valuelistFromProjectField
                    = source[sourceFieldName].valuelistFromProjectField;
            }
        }
    }
}