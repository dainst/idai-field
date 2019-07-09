import {CsvRowsConversion} from './csv-rows-conversion';
import {makeLines, Parser} from './parser';
import {flow} from 'tsfun';

/**
 * @author Daniel de Oliveira
 */
export module CsvParser {

    export const SEP = ',';

    export const getParse = (typeName: string, operationId: string): Parser =>
            (content: string) => {

                const documents = flow<any>(content,
                    makeLines,
                    CsvRowsConversion.parse(typeName, SEP, operationId));

                return Promise.resolve(documents);
            }
}