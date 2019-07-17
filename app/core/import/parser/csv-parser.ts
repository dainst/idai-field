import {Document, IdaiType, Resource} from 'idai-components-2';
import {makeLines, Parser} from './parser';
import {assoc, flow, map, identity} from 'tsfun';
import {CsvFieldTypesConversion} from './csv-field-types-conversion';
import {CsvRowsConversion} from './csv-rows-conversion';
import parse = CsvRowsConversion.parse;
import convertFieldTypes = CsvFieldTypesConversion.convertFieldTypes;


/**
 * @author Daniel de Oliveira
 */
export module CsvParser {

    export const SEP = ',';

    const toDocument = (resource: Resource) => { return { resource: resource } as Document; };


    function insertIsChildOf(operationId: string) {

        return assoc(
            'relations',
            operationId
                ? { isChildOf: operationId as any}
                : {});
    }


    /**
     * @param type
     * @param operationId converted into isChildOf entry if not empty
     */
    export const getParse = (type: IdaiType, operationId: string): Parser => {

        /**
         * @throws [CSV_GENERIC] // currently unused
         * @throws [CSV_NOT_A_NUMBER]
         */
        return (content: string) => {

            try {

                return Promise.resolve(doParse(type, operationId, content));

            } catch (msgWithParams) {

                return Promise.reject(msgWithParams);
            }
        };
    };


    function doParse(type: IdaiType, operationId: string, content: string) {

        return flow<any>(content,
            makeLines,
            parse(SEP),
            map(assoc('type', type.name)),
            map(insertIsChildOf(operationId)),
            map(convertFieldTypes(type)),
            map(toDocument));
    }
}