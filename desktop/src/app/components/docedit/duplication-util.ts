import { clone}  from 'tsfun';
import { NewDocument, Document } from 'idai-field-core';
import { Validator } from '../../model/validator';


/**
 * @author Thomas Kleinke
 */
export module DuplicationUtil {

    export function createTemplate(document: Document): NewDocument {

        const template: NewDocument = { resource: clone(document.resource) };

        delete template.resource.id;
        delete template.resource.geometry;
        delete template.resource.scanCode;

        template.resource.relations = {};
        if (document.resource.relations.isRecordedIn) {
            template.resource.relations.isRecordedIn = document.resource.relations.isRecordedIn;
        }
        if (document.resource.relations.liesWithin) {
            template.resource.relations.liesWithin = document.resource.relations.liesWithin;
        }

        return template;
    }


    export function splitIdentifier(identifier: string)
            : { baseIdentifier: string, identifierNumber: number, minDigits: number } {

        const matches = identifier.match(/\d+$/);
        if (matches) {
            return {
                baseIdentifier: identifier.substring(0, identifier.length - matches[0].length),
                identifierNumber: parseInt(matches[0]),
                minDigits: matches[0].length
            };
        } else {
            return { baseIdentifier: identifier, identifierNumber: 1, minDigits: 1 };
        }
    }


    export async function setUniqueIdentifierForDuplicate(document: NewDocument, baseIdentifier: string,
                                                          identifierNumber: number, minDigits: number,
                                                          validator: Validator): Promise<number> {

        let uniqueIdentifier: boolean = false;

        do {
            identifierNumber++;

            document.resource.identifier = baseIdentifier
                + getNumberAsString(identifierNumber, minDigits);
            try {
                await validator.assertIdentifierIsUnique(document);
                uniqueIdentifier = true;
            } catch(e) {
                uniqueIdentifier = false;
            }
        } while (!uniqueIdentifier);

        return identifierNumber;
    }


    function getNumberAsString(identifierNumber: number, minDigits: number): string {

        let number: string = identifierNumber.toString();
        const missingDigits: number = minDigits - number.length;

        for (let i = 0; i < missingDigits; i++) {
            number = '0' + number;
        }

        return number;
    }
}
