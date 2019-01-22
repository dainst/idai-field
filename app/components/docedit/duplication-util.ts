import {NewDocument} from 'idai-components-2';
import {Validator} from '../../core/model/validator';


/**
 * @author Thomas Kleinke
 */
export module DuplicationUtil {

    export function splitIdentifier(identifier: string): { baseIdentifier: string, identifierNumber: number } {

        const matches = identifier.match(/\d+$/);
        if (matches) {
            return {
                baseIdentifier: identifier.substring(0, identifier.length - matches[0].length),
                identifierNumber: parseInt(matches[0])
            };
        } else {
            return { baseIdentifier: identifier, identifierNumber: 1 };
        }
    }


    export async function setUniqueIdentifierForDuplicate(document: NewDocument, baseIdentifier: string,
                                                          identifierNumber: number,
                                                          validator: Validator): Promise<number> {

        let uniqueIdentifier: boolean = false;

        do {
            identifierNumber++;
            document.resource.identifier = baseIdentifier + identifierNumber;
            try {
                await validator.assertIdentifierIsUnique(document);
                uniqueIdentifier = true;
            } catch(e) {
                uniqueIdentifier = false;
            }
        } while (!uniqueIdentifier);

        return identifierNumber;
    }
}