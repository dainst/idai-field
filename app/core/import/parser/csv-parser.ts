import {assoc, update, flow, map} from 'tsfun';
import {Document, Resource, Relations} from 'idai-components-2';
import {Parser} from './parser';
import {CsvFieldTypesConversion} from './csv-field-types-conversion';
import {CsvRowsConversion} from './csv-rows-conversion';
import parse = CsvRowsConversion.parse;
import convertFieldTypes = CsvFieldTypesConversion.convertFieldTypes;
import {IdaiType} from '../../configuration/model/idai-type';


/**
 * @author Daniel de Oliveira
 */
export module CsvParser {

    const toDocument = (resource: Resource) => { return { resource: resource } as Document; };


    const insertRelations = update(
            'relations',
            (relations: Relations|undefined) => relations ? relations : {});


    /**
     * @param type
     * @param operationId converted into isChildOf entry if not empty
     * @param separator
     */
    export const getParse = (type: IdaiType, operationId: string, separator: string): Parser => {

        /**
         * @throws [CSV_GENERIC] // currently unused
         * @throws [CSV_NOT_A_NUMBER]
         */
        return (content: string) => {

            try {
                return Promise.resolve(doParse(type, content, separator));
            } catch (msgWithParams) {
                return Promise.reject(msgWithParams);
            }
        };
    };


    function doParse(type: IdaiType, content: string, separator: string) {

        return flow(content,
            parse(separator),
            map(assoc('type', type.name)),
            map(insertRelations),
            map(convertFieldTypes(type)),
            map(toDocument));
    }
}