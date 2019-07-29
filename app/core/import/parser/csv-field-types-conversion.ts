import {getOnOr, includedIn, is, isNot, on, setOn, isnt} from 'tsfun';
import {IdaiType, Resource, Dimension, Dating} from 'idai-components-2';
import {ParserErrors} from './parser-errors';
import {PARENT} from '../../../c';
import {CSVExport} from '../../export/csv-export';
import ARRAY_SEPARATOR = CSVExport.ARRAY_SEPARATOR;


/**
 * Converts string values to values of other types, based on field type information.
 * No validation other than errors resulting from parsing values from strings is handled here.
 *
 * @author Daniel de Oliveira
 */
export module CsvFieldTypesConversion {

    type FieldType = 'dating' | 'date' | 'dimension' | 'checkboxes' | 'radio'
        | 'dropdownRange' | 'boolean' | 'text' | 'input' | 'unsignedInt' | 'unsignedFloat' | 'checkboxes'; // | 'geometry'


    const UNCHECKED_FIELDS = ['relation', 'geometry', 'type'];


    const fields = (resource: Resource) => Object.keys(resource).filter(isNot(includedIn(UNCHECKED_FIELDS)));


    /**
     * Conversion of resource done by reference, i.e. in place
     */
    export function convertFieldTypes(type: IdaiType) { return (resource: Resource) => {

        for (let fieldName of fields(resource)) {

            const fieldDefinition = type.fields.find(on('name', is(fieldName)));
            if (!fieldDefinition) continue;

            const inputType = fieldDefinition.inputType as unknown as FieldType;
            convertTypeDependent(resource, fieldName, inputType);
        }

        for (let relationName of Object.keys(resource.relations).filter(isnt(PARENT))) {
            resource.relations[relationName] = (resource.relations[relationName] as unknown as string).split(ARRAY_SEPARATOR)
        }

        return resource;
    }}


    const convertUnsignedInt = convertNumber;    // here only string to number, validation in exec

    const convertUnsignedFloat = convertNumber;  // here only string to number, validation in exec


    function convertTypeDependent(resource: Resource, fieldName: string, inputType: FieldType) {

        // leave 'date' as is
        // leave 'radio' as is
        if (inputType === 'boolean')       convertBoolean(resource, fieldName);
        if (inputType === 'dating')        convertDating(resource, fieldName);
        if (inputType === 'dimension')     convertDimension(resource, fieldName);
        if (inputType === 'checkboxes')    convertCheckboxes(resource, fieldName);
        if (inputType === 'unsignedInt')   convertUnsignedInt(resource, fieldName);
        if (inputType === 'unsignedFloat') convertUnsignedFloat(resource, fieldName);
    }


    function convertCheckboxes(resource: Resource, fieldName: string) {

        resource[fieldName] = resource[fieldName].split(';');
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

                convertNumber(dating, 'begin.inputYear');
                convertNumber(dating, 'end.inputYear');
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