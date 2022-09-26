import { MsgWithParams } from '../components/messages/msg-with-params';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export namespace ProjectNameValidation {

    const PROJECT_NAME_MAX_LENGTH: number = 18;

    export module Errors {

        export const RESOURCES_ERROR_NO_PROJECT_NAME = 'projectNameValidator/errors/resources_error_no_project_name';
        export const RESOURCES_ERROR_PROJECT_NAME_EXISTS = 'projectNameValidator/errors/resources_error_projectNameExists';
        export const RESOURCES_ERROR_PROJECT_NAME_LENGTH = 'projectNameValidator/errors/resources_error_projectNameLength';
        export const RESOURCES_ERROR_PROJECT_NAME_SYMBOLS = 'projectNameValidator/errors/resources_error_projectNameSymbols';
    }


    /**
     * @returns msgWithParams if invalid, otherwise undefined
     */
    export function validate(newProjectName: string, existingProjectNames?: string[]): MsgWithParams|undefined {

        if (!newProjectName) return [Errors.RESOURCES_ERROR_NO_PROJECT_NAME];

        if (existingProjectNames && existingProjectNames.includes(newProjectName)) {
            return [Errors.RESOURCES_ERROR_PROJECT_NAME_EXISTS, newProjectName];
        }

        const lengthDiff = newProjectName.length - PROJECT_NAME_MAX_LENGTH;
        if (lengthDiff > 0) return [Errors.RESOURCES_ERROR_PROJECT_NAME_LENGTH, lengthDiff.toString()];

        const allowed = /^[0-9a-z\-_]+$/.test(newProjectName);
        if (!allowed) return [Errors.RESOURCES_ERROR_PROJECT_NAME_SYMBOLS];
    }


    export function isSimilar(projectName1: string, projectName2: string): boolean {

        return projectName1.includes(projectName2) || projectName2.includes(projectName1)
            || (projectName1.substr(0, 3) === projectName2.substr(0, 3));
    }
}
