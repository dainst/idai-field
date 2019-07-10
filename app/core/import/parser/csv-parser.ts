import {IdaiType, Document, Resource, Dating, Dimension} from 'idai-components-2';
import {CsvRowsConversion} from './csv-rows-conversion';
import {makeLines, Parser} from './parser';
import {flow, map, on, is, isNot, includedIn, setOn, getOnOr} from 'tsfun';
import {ParserErrors} from './parser-errors';


/**
 * @author Daniel de Oliveira
 */
export module CsvParser {

    export const SEP = ',';

    const toDocument = (resource: Resource) => { return { resource: resource } as Document; };

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

        /**
         * @throws [CSV_GENERIC]
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
            CsvRowsConversion.parse(SEP),
            map(insertTypeName(type)), // TODO make assoc function
            map(insertIsChildOf(operationId)),
            map(convertFieldTypes(type)),
            map(toDocument));
    }


    type FieldType = 'dating' | 'date' | 'dimension' | 'checkboxes' | 'radio'
        | 'dropdownRange' | 'boolean' | 'text' | 'input' | 'unsignedInt' | 'unsignedFloat' | 'checkboxes'; // | 'geometry'


    /**
     * @param type
     * // TODO make it return an Either for each resource, and at the end evaluate it
     */
    function convertFieldTypes(type: IdaiType) { return (resource: Resource) => { // TODO handle errors

        for (let fieldName of
            Object.keys(resource)
                .filter(isNot(includedIn(['relation', 'geometry', 'type'])))) {

            const fieldDefinition = type.fields.find(on('name', is(fieldName)));
            if (!fieldDefinition) continue; // TODO review
            // throw "CSV Parser - missing field definition " + fieldName;

            const inputType = fieldDefinition.inputType as unknown as FieldType;
            convertTypeDependent(resource, fieldName, inputType);
        }

        return resource;
    }}


    function convertTypeDependent(resource: Resource, fieldName: string, inputType: FieldType) {

        if (inputType === 'boolean')    convertBoolean(resource, fieldName);
        if (inputType === 'dating')     convertDating(resource, fieldName);
        if (inputType === 'dimension')  convertDimension(resource, fieldName);
        if (inputType === 'checkboxes') convertCheckboxes(resource, fieldName);
        if (inputType === 'unsignedInt') convertUnsignedInt(resource, fieldName);
        if (inputType === 'unsignedFloat') convertUnsignedFloat(resource, fieldName);
    }


    function convertUnsignedInt(resource: Resource, fieldName: string) {

        convertNumber(resource, fieldName);
        // const val = getOn(fieldName, undefined)(resource);
        // if negative, throw
    }


    function convertUnsignedFloat(resource: Resource, fieldName: string) {

        convertNumber(resource, fieldName);
        // const val = getOn(fieldName, undefined)(resource);
        // if negative, throw
    }


    function convertCheckboxes(resource: Resource, fieldName: string) {

        resource[fieldName] = resource[fieldName].split(';'); // TODO review if this should be done here
    }


    function convertDimension(resource: Resource, fieldName: string) {

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


    function convertDating(resource: Resource, fieldName: string) {

        for (let dating of resource[fieldName] as Array<Dating>) {
            // const dating = resource['dating']; // TODO should exist

            convertNumber(dating, 'begin.year');
            convertNumber(dating, 'end.year');
            convertNumber(dating, 'margin');
            convertBoolean(dating, 'isImprecise');
            convertBoolean(dating, 'isUncertain');
        }
    }


    function convertNumber(container: any, path: string) {

        const val = getOnOr(path, undefined)(container);
        if (!val) return; // TODO review
        const converted = parseInt(val);
        if (isNaN(converted)) throw [ParserErrors.CSV_NOT_A_NUMBER, val, path];
        setOn(container, path)(converted);
    }


    function convertBoolean(container: any, path: string) {

        const val = getOnOr(path, undefined)(container);
        if (!val) throw [ParserErrors.CSV_GENERIC]; // TODO replace
        if (isNot(includedIn(['true', 'false']))(val)) throw "cannot parse boolean";
        setOn(container, path)(val === 'true');
    }
}