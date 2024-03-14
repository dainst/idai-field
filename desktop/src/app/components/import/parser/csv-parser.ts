import { flow, map, update as updateD, assoc } from 'tsfun';
import { Document, Resource, CategoryForm } from 'idai-field-core';
import { Parser } from './parser';
import { convertCsvRows } from './convert-csv-rows';
import { convertFields } from './convert-fields';


/**
 * @author Daniel de Oliveira
 */
export module CsvParser {

    const toDocument = (resource: Resource) => { return { resource: resource } as Document; };


    const insertRelations = assoc(
            'relations',
            (relations: Resource.Relations|undefined) => relations ? relations : {});


    /**
     * @param category
     * @param operationId converted into isChildOf entry if not empty
     * @param separator
     */
    export const build = (category: CategoryForm, operationId: string, separator: string): Parser => {

        /**
         * ParserErrors
         * @throws [CSV_GENERIC] // currently unused
         * @throws [CSV_NOT_A_NUMBER]
         * @throws [CSV_INVALID_HEADING]
         */
        return content => {

            try {
                return Promise.resolve(doParse(category, content, separator));
            } catch (msgWithParams) {
                return Promise.reject(msgWithParams);
            }
        };
    };


    function doParse(category: CategoryForm, content: string, separator: string): Array<Document> {

        return flow(content,
            convertCsvRows(separator),
            map(updateD('category', category.name)),
            map(insertRelations),
            map(convertFields(category)),
            map(toDocument) as any);
    }
}
