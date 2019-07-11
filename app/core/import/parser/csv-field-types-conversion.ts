import {IdaiType} from 'idai-components-2/src/configuration/idai-type';
import {Resource} from 'idai-components-2/src/model/core/resource';
import {getOnOr, includedIn, is, isNot, on, setOn} from 'tsfun';
import {Dimension} from 'idai-components-2/src/model/dimension';
import {Dating} from 'idai-components-2/src/model/dating';
import {ParserErrors} from './parser-errors';

/**
 * @author Daniel de Oliveira
 */
export module CsvFieldTypesConversion {

    type FieldType = 'dating' | 'date' | 'dimension' | 'checkboxes' | 'radio'
        | 'dropdownRange' | 'boolean' | 'text' | 'input' | 'unsignedInt' | 'unsignedFloat' | 'checkboxes'; // | 'geometry'


     // TODO make it return an Either for each resource, and at the end evaluate it
    export function convertFieldTypes(type: IdaiType) { return (resource: Resource) => { // TODO handle errors

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

        if (inputType === 'boolean')       convertBoolean(resource, fieldName);
        if (inputType === 'dating')        convertDating(resource, fieldName);
        if (inputType === 'dimension')     convertDimension(resource, fieldName);
        if (inputType === 'checkboxes')    convertCheckboxes(resource, fieldName);
        if (inputType === 'unsignedInt')   convertUnsignedInt(resource, fieldName);
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

        let i = 0;
        for (let dimension of resource[fieldName] as Array<Dimension>) {

            try {

                convertNumber(dimension, 'value');
                convertNumber(dimension, 'rangeMin');
                convertNumber(dimension, 'rangeMax');
                convertNumber(dimension, 'inputValue');
                convertNumber(dimension, 'inputRangeEndValue');
                convertBoolean(dimension, 'isImprecise');
                convertBoolean(dimension, 'isRange');

            } catch (msgWithParams) {
                throw [msgWithParams[0], msgWithParams[1], fieldName + '.' + i + '.' + msgWithParams[2]]
            }
            i++;
        }
    }


    function convertDating(resource: Resource, fieldName: string) {

        let i = 0;
        for (let dating of resource[fieldName] as Array<Dating>) {

            try {

                convertNumber(dating, 'begin.year');
                convertNumber(dating, 'end.year');
                convertNumber(dating, 'margin');
                convertBoolean(dating, 'isImprecise');
                convertBoolean(dating, 'isUncertain');

            } catch (msgWithParams) {
                throw [msgWithParams[0], msgWithParams[1], fieldName + '.' + i + '.' + msgWithParams[2]]
            }
            i++;
        }
    }


    /**
     * Modifies container at path by converting string to number.
     * Returns early if no value at path.
     *
     * @param container
     * @param path
     */
    function convertNumber(container: any, path: string) {

        const val = getOnOr(path, undefined)(container);
        if (!val) return;
        const converted = parseInt(val);
        if (isNaN(converted)) throw [ParserErrors.CSV_NOT_A_NUMBER, val, path];
        setOn(container, path)(converted);
    }


    /**
     * Modifies container at path by convertin string to boolan.
     * Returns early if no value at path.
     *
     * @param container
     * @param path
     */
    function convertBoolean(container: any, path: string) {

        const val = getOnOr(path, undefined)(container);
        if (!val) return;
        if (isNot(includedIn(['true', 'false']))(val)) throw [ParserErrors.CSV_NOT_A_BOOLEAN, val, path];
        setOn(container, path)(val === 'true');
    }
}