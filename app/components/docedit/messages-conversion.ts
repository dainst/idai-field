import {ProjectConfiguration} from 'idai-components-2';
import {ValidationErrors} from '../../core/model/validation-errors';
import {M} from '../m';


/**
 * * Converts messages of Validator to messages of M for DoceditComponent.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module MessagesConversion {

    export function convertMessage(msgWithParams: string[], projectConfiguration: ProjectConfiguration): string[] {

        if (msgWithParams.length === 0) return [];

        const msg = msgWithParams[0];

        if (msg === ValidationErrors.NO_ISRECORDEDIN) msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_NO_RECORDEDIN;
        if (msg === ValidationErrors.NO_ISRECORDEDIN_TARGET) msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_NO_RECORDEDIN_TARGET;
        if (msg === ValidationErrors.IDENTIFIER_ALREADY_EXISTS) msgWithParams[0] = M.MODEL_VALIDATION_IDENTIFIER_ALREADY_EXISTS;

        if (msg === ValidationErrors.MISSING_PROPERTY) {
            msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_MISSING_PROPERTY;
            msgWithParams[2] = replaceFieldNamesWithLabels(msgWithParams[2], msgWithParams[1], projectConfiguration);
            msgWithParams[1] = projectConfiguration.getLabelForType(msgWithParams[1]);
        }

        if (msg === ValidationErrors.INVALID_NUMERICAL_VALUES) {
            if (msgWithParams.length > 2 && msgWithParams[2].includes(',')) {
                msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES;
                msgWithParams[2] = replaceFieldNamesWithLabels(msgWithParams[2], msgWithParams[1], projectConfiguration);
                msgWithParams[1] = projectConfiguration.getLabelForType(msgWithParams[1]);
            } else {
                msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE;
                msgWithParams[2] = projectConfiguration.getFieldDefinitionLabel(msgWithParams[1], msgWithParams[2]);
                msgWithParams[1] = projectConfiguration.getLabelForType(msgWithParams[1]);
            }
        }

        return msgWithParams;
    }


    function replaceFieldNamesWithLabels(fieldNames: string, typeName: string,
                                         projectConfiguration: ProjectConfiguration): string {

        return fieldNames
            .split(', ')
            .map(fieldName => projectConfiguration.getFieldDefinitionLabel(typeName, fieldName))
            .join(', ');
    }
}