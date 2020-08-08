import {flow, map, update as updateD} from 'tsfun';
import {update} from 'tsfun/associative'
import {Document, Resource, Relations} from 'idai-components-2';
import {Parser} from './parser';
import {Category} from '../../configuration/model/category';
import {convertCsvRows} from './convert-csv-rows';
import {convertFieldTypes} from './convert-field-types';


/**
 * @author Daniel de Oliveira
 */
export module CsvParser {

    const toDocument = (resource: Resource) => { return { resource: resource } as Document; };


    const insertRelations = update(
            'relations',
            (relations: Relations|undefined) => relations ? relations : {});


    /**
     * @param category
     * @param operationId converted into isChildOf entry if not empty
     * @param separator
     */
    export const build = (category: Category, operationId: string, separator: string): Parser => {

        /**
         * ParserErrors
         * @throws [CSV_GENERIC] // currently unused
         * @throws [CSV_NOT_A_NUMBER]
         * @throws [CSV_INVALID_HEADING]
         */
        return (content: string) => {

            try {
                return Promise.resolve(doParse(category, content, separator));
            } catch (msgWithParams) {
                return Promise.reject(msgWithParams);
            }
        };
    };


    function doParse(category: Category, content: string, separator: string) {

        return flow(content,
            convertCsvRows(separator),
            map(updateD('category', category.name)),
            map(insertRelations),
            map(convertFieldTypes(category)),
            map(toDocument));
    }
}
