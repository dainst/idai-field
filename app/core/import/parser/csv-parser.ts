import {IdaiType} from 'idai-components-2';
import {CsvRowsConversion} from './csv-rows-conversion';
import {makeLines, Parser} from './parser';
import {flow} from 'tsfun';

/**
 * @author Daniel de Oliveira
 */
export module CsvParser {

    export const SEP = ',';

    export const getParse = (type: IdaiType, operationId: string): Parser =>
            (content: string) => {

                const documents = flow<any>(content,
                    makeLines,
                    CsvRowsConversion.parse(type.name, SEP, operationId));

                return Promise.resolve(documents);
            }
}