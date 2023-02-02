import { MsgWithParams } from '../components/messages/msg-with-params';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export namespace ProjectIdentifierValidation {

    export const PROJECT_IDENTIFIER_MAX_LENGTH: number = 30;

    export module Errors {

        export const PROJECT_IDENTIFIER_ERROR_MISSING = 'projectIdentifierValidation/errors/missing';
        export const PROJECT_IDENTIFIER_ERROR_EXISTS = 'projectIdentifierValidation/errors/exists';
        export const PROJECT_IDENTIFIER_ERROR_LENGTH = 'projectIdentifierValidation/errors/length';
        export const PROJECT_IDENTIFIER_ERROR_CHARACTERS = 'projectIdentifierValidation/errors/characters';
        export const PROJECT_IDENTIFIER_ERROR_STARTING_CHARACTER = 'projectIdentifierValidation/errors/startingCharacter';
    }


    /**
     * @returns msgWithParams if invalid, otherwise undefined
     */
    export function validate(newIdentifier: string, existingIdentifier?: string[]): MsgWithParams|undefined {

        newIdentifier = newIdentifier?.trim();

        if (!newIdentifier) return [Errors.PROJECT_IDENTIFIER_ERROR_MISSING];

        if (existingIdentifier && existingIdentifier.includes(newIdentifier)) {
            return [Errors.PROJECT_IDENTIFIER_ERROR_EXISTS, newIdentifier];
        }

        const lengthDiff = newIdentifier.length - PROJECT_IDENTIFIER_MAX_LENGTH;
        if (lengthDiff > 0) return [Errors.PROJECT_IDENTIFIER_ERROR_LENGTH, lengthDiff.toString()];

        const allowed = /^[0-9a-z\-_]+$/.test(newIdentifier);
        if (!allowed) return [Errors.PROJECT_IDENTIFIER_ERROR_CHARACTERS];

        const firstCharacterAllowed = /^[a-z]+$/.test(newIdentifier[0]);
        if (!firstCharacterAllowed) return [Errors.PROJECT_IDENTIFIER_ERROR_STARTING_CHARACTER];
    }


    export function isSimilar(identifier1: string, identifier2: string): boolean {

        return identifier1.includes(identifier2) || identifier2.includes(identifier1)
            || (identifier1.substr(0, 3) === identifier2.substr(0, 3));
    }
}
