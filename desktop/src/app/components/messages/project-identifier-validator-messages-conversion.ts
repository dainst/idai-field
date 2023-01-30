import { ProjectIdentifierValidation } from '../../model/project-identifier-validation';
import { M } from './m';
import { MsgWithParams } from './msg-with-params';


export module ProjectIdentifierValidatorMessagesConversion {

    export function convert(msgWithParams: MsgWithParams|undefined): MsgWithParams|undefined {

        if (msgWithParams === undefined) return undefined;
        if (msgWithParams.length === 0) return msgWithParams;
        let m = msgWithParams[0];
        if (msgWithParams[0] === ProjectIdentifierValidation.Errors.PROJECT_IDENTIFIER_ERROR_MISSING) {
            m = M.PROJECT_CREATION_ERROR_MISSING_IDENTIFIER;
        }
        if (msgWithParams[0] === ProjectIdentifierValidation.Errors.PROJECT_IDENTIFIER_ERROR_EXISTS) {
            m = M.PROJECT_CREATION_ERROR_IDENTIFIER_EXISTS;
        }
        if (msgWithParams[0] === ProjectIdentifierValidation.Errors.PROJECT_IDENTIFIER_ERROR_LENGTH) {
            m = M.PROJECT_CREATION_ERROR_IDENTIFIER_LENGTH;
        }
        if (msgWithParams[0] === ProjectIdentifierValidation.Errors.PROJECT_IDENTIFIER_ERROR_CHARACTERS) {
            m = M.PROJECT_CREATION_ERROR_IDENTIFIER_CHARACTERS;
        }
        if (msgWithParams[0] === ProjectIdentifierValidation.Errors.PROJECT_IDENTIFIER_ERROR_STARTING_CHARACTER) {
            m = M.PROJECT_CREATION_ERROR_IDENTIFIER_STARTING_CHARACTER;
        }

        return [m].concat(msgWithParams.slice(1)) as MsgWithParams;
    }
}
