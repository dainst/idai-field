import {NativeJsonlParser} from './native-jsonl-parser';
import {ParserErrors} from './parser-errors';
import {Parser} from './parser';


/**
 * @author Thomas Kleinke
 */
export module ShapefileParser {

    export const parse: Parser = (content: string) => {

        return new Promise((resolve: Function, reject: Function) => {
            try {
                resolve(NativeJsonlParser.parse(content));
            } catch (err) {
                reject([ParserErrors.SHAPEFILE_GENERIC]);
            }
        });
    }
}