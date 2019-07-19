import {assoc, update, flow, map} from 'tsfun';
import {Document, IdaiType, Resource, Relations} from 'idai-components-2';
import {Parser} from './parser';
import {CsvFieldTypesConversion} from './csv-field-types-conversion';
import {CsvRowsConversion} from './csv-rows-conversion';
import parse = CsvRowsConversion.parse;
import convertFieldTypes = CsvFieldTypesConversion.convertFieldTypes;
import {jsonClone} from 'tsfun';


/**
 * @author Daniel de Oliveira
 */
export module CsvParser {

    export const SEPARATOR = ',';

    const toDocument = (resource: Resource) => { return { resource: resource } as Document; };


    function insertIsChildOf(operationId: string) {

        return update(
            'relations',
            (relations: Relations|undefined) => { // TODO test different cases for (non) existing relations manually

                const relations_ = relations ? jsonClone(relations) : {};
                if (operationId && !relations_['isChildOf']) relations_['isChildOf'] = operationId as any;
                return relations_;
            });
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
            parse(SEPARATOR),
            map(assoc('type', type.name)),
            map(insertIsChildOf(operationId)),
            map(convertFieldTypes(type)),
            map(toDocument));
    }
}