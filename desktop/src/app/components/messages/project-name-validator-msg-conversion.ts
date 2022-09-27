import { ProjectNameValidation } from '../../model/project-name-validation';
import { M } from './m';
import { MsgWithParams } from './msg-with-params';


export module ProjectNameValidatorMsgConversion {

    export function convert(msgWithParams: MsgWithParams|undefined): MsgWithParams|undefined {

        if (msgWithParams === undefined) return undefined;
        if (msgWithParams.length === 0) return msgWithParams;
        let m = msgWithParams[0];
        if (msgWithParams[0] === ProjectNameValidation.Errors.RESOURCES_ERROR_NO_PROJECT_NAME) {
            m = M.RESOURCES_ERROR_NO_PROJECT_NAME;
        }
        if (msgWithParams[0] === ProjectNameValidation.Errors.RESOURCES_ERROR_PROJECT_NAME_EXISTS) {
            m = M.RESOURCES_ERROR_PROJECT_NAME_EXISTS;
        }
        if (msgWithParams[0] === ProjectNameValidation.Errors.RESOURCES_ERROR_PROJECT_NAME_LENGTH) {
            m = M.RESOURCES_ERROR_PROJECT_NAME_LENGTH;
        }
        if (msgWithParams[0] === ProjectNameValidation.Errors.RESOURCES_ERROR_PROJECT_NAME_SYMBOLS) {
            m = M.RESOURCES_ERROR_PROJECT_NAME_SYMBOLS;
        }

        return [m].concat(msgWithParams.slice(1)) as MsgWithParams;
    }
}
