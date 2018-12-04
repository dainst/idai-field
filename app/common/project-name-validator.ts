import {M} from '../components/m';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module ProjectNameValidator {

    const PROJECT_NAME_MAX_LENGTH: number = 18;

    /**
     * @returns msgWithParams if invalid, otherwise undefined
     */
    export function validate(newProjectName: string, existingProjectNames?: string[]): string[]|undefined {

        if (newProjectName === '') return [M.RESOURCES_ERROR_NO_PROJECT_NAME];

        if (existingProjectNames && existingProjectNames.includes(newProjectName)) {
            return [M.RESOURCES_ERROR_PROJECT_NAME_EXISTS, newProjectName];
        }

        const lengthDiff = newProjectName.length - PROJECT_NAME_MAX_LENGTH;
        if (lengthDiff > 0) return [M.RESOURCES_ERROR_PROJECT_NAME_LENGTH, lengthDiff.toString()];

        const allowed = /^[0-9a-z\-_]+$/.test(newProjectName);
        if (!allowed) return [M.RESOURCES_ERROR_PROJECT_NAME_SYMBOLS];
    }
}