import { DatastoreErrors, Name, ProjectConfiguration, Labels } from 'idai-field-core';
import { ValidationErrors } from '../../model/validation-errors';
import { M } from '../messages/m';
import { MsgWithParams } from '../messages/msg-with-params';


/**
 * Converts datastore errors and messages of Validator to messages of M for DoceditComponent.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module MessagesConversion {

    export function convertMessage(msgWithParams: MsgWithParams, projectConfiguration: ProjectConfiguration,
                                   labels: Labels): MsgWithParams {

        if (msgWithParams.length === 0) return [M.DOCEDIT_ERROR_SAVE];

        const msg = msgWithParams[0];

        if (msg === DatastoreErrors.GENERIC_ERROR) msgWithParams[0] = M.DOCEDIT_ERROR_SAVE;
        if (msg === DatastoreErrors.REMOVE_REVISIONS_ERROR) msgWithParams[0]= M.DOCEDIT_ERROR_RESOLVE_CONFLICT;
        if (msg === ValidationErrors.NO_ISRECORDEDIN) msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_NO_RECORDEDIN;
        if (msg === ValidationErrors.IDENTIFIER_ALREADY_EXISTS) msgWithParams[0] = M.MODEL_VALIDATION_IDENTIFIER_ALREADY_EXISTS;
        if (msg === ValidationErrors.GENERIC_DATASTORE) msgWithParams[0] = M.DOCEDIT_ERROR_SAVE;
        if (msg === ValidationErrors.INVALID_COORDINATES) msgWithParams[0] = M.MODEL_VALIDATION_INVALID_COORDINATES;
        if (msg === ValidationErrors.MISSING_COORDINATES) msgWithParams[0] = M.MODEL_VALIDATION_MISSING_COORDINATES;
        if (msg === ValidationErrors.MISSING_GEOMETRY_TYPE) msgWithParams[0] = M.MODEL_VALIDATION_MISSING_GEOMETRYTYPE;
        if (msg === ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE) msgWithParams[0] = M.MODEL_VALIDATION_UNSUPPORTED_GEOMETRY_TYPE;
        if (msg === ValidationErrors.END_DATE_BEFORE_BEGINNING_DATE) msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_END_DATE_BEFORE_BEGINNING_DATE;

        if (msg === ValidationErrors.MISSING_PROPERTY) {
            msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_MISSING_PROPERTY;
            msgWithParams[2] = replaceFieldNamesWithLabels(msgWithParams[2], msgWithParams[1], projectConfiguration, labels);
            msgWithParams[1] = labels.get(projectConfiguration.getCategory(msgWithParams[1]));
        }

        if (msg === ValidationErrors.MAX_CHARACTERS_EXCEEDED) {
            msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_MAX_CHARACTERS_EXCEEDED;
            msgWithParams[2] = labels.getFieldLabel(projectConfiguration.getCategory(msgWithParams[1]), msgWithParams[2]);
            msgWithParams[1] = labels.get(projectConfiguration.getCategory(msgWithParams[1]));
        }

        if (msg === ValidationErrors.INVALID_NUMERICAL_VALUES) {
            if (msgWithParams.length > 2 && msgWithParams[2].includes(',')) {
                msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES;
                msgWithParams[2] = replaceFieldNamesWithLabels(msgWithParams[2], msgWithParams[1], projectConfiguration, labels);
                msgWithParams[1] = labels.get(projectConfiguration.getCategory(msgWithParams[1]));
            } else {
                msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE;
                msgWithParams[2] = labels.getFieldLabel(projectConfiguration.getCategory(msgWithParams[1]), msgWithParams[2]);
                msgWithParams[1] = labels.get(projectConfiguration.getCategory(msgWithParams[1]));
            }
        }

        if (msg === ValidationErrors.INVALID_URLS) {
            if (msgWithParams.length > 2 && msgWithParams[2].includes(',')) {
                msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_INVALID_URLS;
                msgWithParams[2] = replaceFieldNamesWithLabels(msgWithParams[2], msgWithParams[1], projectConfiguration, labels);
                msgWithParams[1] = labels.get(projectConfiguration.getCategory(msgWithParams[1]));
            } else {
                msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_INVALID_URL;
                msgWithParams[2] = labels.getFieldLabel(projectConfiguration.getCategory(msgWithParams[1]), msgWithParams[2]);
                msgWithParams[1] = labels.get(projectConfiguration.getCategory(msgWithParams[1]));
            }
        }

        if (msg === ValidationErrors.INVALID_DATING_VALUES) {
            if (msgWithParams.length > 2 && msgWithParams[2].includes(',')) {
                msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_INVALID_DATING_VALUES;
                msgWithParams[2] = replaceFieldNamesWithLabels(msgWithParams[2], msgWithParams[1], projectConfiguration, labels);
                msgWithParams[1] = labels.get(projectConfiguration.getCategory(msgWithParams[1]));
            } else {
                msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_INVALID_DATING_VALUE;
                msgWithParams[2] = labels.getFieldLabel(projectConfiguration.getCategory(msgWithParams[1]), msgWithParams[2]);
                msgWithParams[1] = labels.get(projectConfiguration.getCategory(msgWithParams[1]));
            }
        }

        if (msg === ValidationErrors.INVALID_DIMENSION_VALUES) {
            if (msgWithParams.length > 2 && msgWithParams[2].includes(',')) {
                msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_INVALID_DIMENSION_VALUES;
                msgWithParams[2] = replaceFieldNamesWithLabels(msgWithParams[2], msgWithParams[1], projectConfiguration, labels);
                msgWithParams[1] = labels.get(projectConfiguration.getCategory(msgWithParams[1]));
            } else {
                msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_INVALID_DIMENSION_VALUE;
                msgWithParams[2] = labels.getFieldLabel(projectConfiguration.getCategory(msgWithParams[1]), msgWithParams[2]);
                msgWithParams[1] = labels.get(projectConfiguration.getCategory(msgWithParams[1]));
            }
        }

        if (msg === ValidationErrors.INVALID_DECIMAL_SEPARATORS) {
            if (msgWithParams.length > 2 && msgWithParams[2].includes(',')) {
                msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_INVALID_DECIMAL_SEPARATORS;
                msgWithParams[2] = replaceFieldNamesWithLabels(msgWithParams[2], msgWithParams[1], projectConfiguration ,labels);
                msgWithParams[1] = labels.get(projectConfiguration.getCategory(msgWithParams[1]));
            } else {
                msgWithParams[0] = M.DOCEDIT_VALIDATION_ERROR_INVALID_DECIMAL_SEPARATOR;
                msgWithParams[2] = labels.getFieldLabel(projectConfiguration.getCategory(msgWithParams[1]), msgWithParams[2]);
                msgWithParams[1] = labels.get(projectConfiguration.getCategory(msgWithParams[1]));
            }
        }

        return msgWithParams;
    }


    function replaceFieldNamesWithLabels(fields: string, category: Name, projectConfiguration: ProjectConfiguration,
                                         labels: Labels): string {

        return fields
            .split(', ')
            .map(fieldName => labels.getFieldLabel(projectConfiguration.getCategory(category), fieldName))
            .join(', ');
    }
}
