import {CsvParsing} from './csv-parsing';
import {Parser} from './parser';

/**
 * @author Daniel de Oliveira
 */
export module CsvParser {

    export const SEP = ',';

    export const getParse = (typeName: string, operationId: string): Parser =>
            (content: string) => Promise.resolve(CsvParsing.parse(content, typeName, SEP, operationId));
}