import {IdaiType, Document, Resource, Dating, Dimension} from 'idai-components-2';
import {CsvRowsConversion} from './csv-rows-conversion';
import {makeLines, Parser} from './parser';
import {flow, map, on, is, isNot, includedIn, setOn, getOnOr} from 'tsfun';


/**
 * @author Daniel de Oliveira
 */
export module CsvParser {

    export const SEP = ',';

    const toResource = (resource: Resource) => { return { resource: resource } as Document; };

    const insertTypeName = (type: IdaiType) => (resource: Resource) => { resource.type = type.name; return resource; };


    function insertIsChildOf(operationId: string) { return (resource: Resource) => {

        if (operationId) resource.relations = { isChildOf: operationId as any };
        return resource;
    }}


    /**
     * @param type
     * @param operationId converted into isChildOf entry if not empty
     */
    export const getParse = (type: IdaiType, operationId: string): Parser => {

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
            CsvRowsConversion.parse(SEP),
            map(insertTypeName(type)), // TODO make assoc function
            map(insertIsChildOf(operationId)),
            map(convertFieldTypes(type)),
            map(toResource));
    }


    /**
     * TODO make case switch statement and define all known types of resources in a typescript string union type. Let's use this typing to make sure via compiler that all known types are covered
     *
     * @param type
     */
    function convertFieldTypes(type: IdaiType) { return (resource: Resource) => { // TODO handle errors

        for (let fieldName of
            Object.keys(resource)
                .filter(isNot(includedIn(['relation', 'geometry', 'type'])))) {

            const fieldDefinition = type.fields.find(on('name', is(fieldName)));
            if (!fieldDefinition) continue; // TODO review
            // throw "CSV Parser - missing field definition " + fieldName;

            if (fieldDefinition.inputType === 'boolean') convertBoolean(resource, fieldName);

            if (fieldDefinition.inputType === 'dating') {
                for (let dating of resource[fieldName] as Array<Dating>) {
                    // const dating = resource['dating']; // TODO should exist

                    convertNumber(dating, 'begin.year');
                    convertNumber(dating, 'end.year');
                    convertNumber(dating, 'margin');
                    convertBoolean(dating, 'isImprecise');
                    convertBoolean(dating, 'isUncertain');
                }
            }

            if (fieldDefinition.inputType === 'dimension') {
                for (let dimension of resource[fieldName] as Array<Dimension>) {
                    // const dimension // TODO should exist

                    convertNumber(dimension, 'value');
                    convertNumber(dimension, 'rangeMin');
                    convertNumber(dimension, 'rangeMax');
                    convertNumber(dimension, 'inputValue');
                    convertNumber(dimension, 'inputRangeEndValue');
                    convertBoolean(dimension, 'isImprecise');
                    convertBoolean(dimension, 'isRange');
                }
            }

            if (fieldDefinition.inputType === 'checkboxes') {

                resource[fieldName] = resource[fieldName].split(';'); // TODO review if this should be done here

            }
            // console.log(fieldDefinition);
        }

        return resource;
    }}


    function convertNumber(container: any, path: string) {

        const val = getOnOr(path, undefined)(container);
        if (!val) return; // TODO review
        const converted = parseInt(val);
        if (isNaN(converted)) throw 'is NaN';
        setOn(container, path)(converted);
    }


    function convertBoolean(container: any, path: string) {

        const val = getOnOr(path, undefined)(container);
        if (!val) throw "not existing";
        if (isNot(includedIn(['true', 'false']))(val)) throw "cannot parse boolean";
        setOn(container, path)(val === 'true');
    }
}