import {IdaiType, Document, Resource} from 'idai-components-2';
import {CsvRowsConversion} from './csv-rows-conversion';
import {makeLines, Parser} from './parser';
import {flow, map, on, is, isnt, isNot, includedIn} from 'tsfun';

/**
 * @author Daniel de Oliveira
 */
export module CsvParser {

    export const SEP = ',';

    const toResource = (resource: Resource) => { return { resource: resource } as Document; };

    const insertTypeName = (type: IdaiType) => (resource: Resource) => { resource.type = type.name; return resource; };


    function insertIsChildOf(operationId: string) {

        return (resource: Resource) => {

            if (operationId) resource.relations = { isChildOf: operationId as any };
            return resource;
        }
    }


    /**
     * @param type
     * @param operationId converted into isChildOf entry if not empty
     */
    export const getParse = (type: IdaiType, operationId: string): Parser =>
            (content: string) => {

                const documents = flow<any>(content,
                    makeLines,
                    CsvRowsConversion.parse(SEP),
                    map(insertTypeName(type)), // TODO make assoc function
                    map(insertIsChildOf(operationId)),
                    map(convertFieldType(type)),
                    map(toResource));

                return Promise.resolve(documents);
            };



    function convertFieldType(type: IdaiType) { return (resource: Resource) => { // TODO handle errors

        for (let fieldName of
            Object.keys(resource)
                .filter(isNot(includedIn(['relation', 'geometry', 'type'])))) {

            const fieldDefinition = type.fields.find(on('name', is(fieldName)));
            if (!fieldDefinition) continue; // TODO review
                // throw "CSV Parser - missing field definition " + fieldName;

            if (fieldDefinition.inputType === 'boolean') {
                if (resource[fieldName] === 'true') resource[fieldName] = true;
                else if (resource[fieldName] === 'false') resource[fieldName] = false;
                else throw "CSV Parser - boolean not parsable";
            }

            // console.log(fieldDefinition);
        }

        return resource;
    }}
}