import { Document } from 'idai-field-core';
import { NativeJsonlParser } from './native-jsonl-parser';
import { ParserErrors } from './parser-errors';
import { Parser } from './parser';
import { MsgWithParams } from '../../messages/msg-with-params';


/**
 * @author Thomas Kleinke
 */
export module ShapefileParser {

    export const parse: Parser = (content: string) => {

        return new Promise(async (resolve: Function, reject: Function) => {
            try {
                const documents: Array<Document> = await NativeJsonlParser.parse(content);
                
                const validationError: MsgWithParams = validate(documents);
                if (validationError) {
                    reject(validationError);
                } else {
                    resolve(documents);
                }
            } catch (err) {
                reject([ParserErrors.SHAPEFILE_GENERIC]);
            }
        });
    }


    function validate(documents: Array<Document>): MsgWithParams|undefined {

        for (let document of documents) {
            if (!document.resource.identifier) {
                return [ParserErrors.MISSING_IDENTIFIER_SHAPEFILE];
            }
        }
        
        return undefined;
    }
}