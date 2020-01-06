import {getOn, includedIn, is, isNot, on, isnt} from 'tsfun';
import {setOn} from 'tsfun-extra';
import {Resource, Dimension, Dating} from 'idai-components-2';
import {ParserErrors} from './parser-errors';
import {PARENT} from '../../model/relation-constants';
import {IdaiType} from '../../configuration/model/idai-type';
import {CSVExport} from '../../export/csv-export';
import ARRAY_SEPARATOR = CSVExport.ARRAY_SEPARATOR;


type FieldType = 'dating' | 'date' | 'dimension' | 'checkboxes' | 'radio'
    | 'dropdownRange' | 'boolean' | 'text' | 'input' | 'unsignedInt' | 'float' | 'unsignedFloat'
    | 'checkboxes'; // | 'geometry'


const UNCHECKED_FIELDS = ['relation', 'geometry', 'type'];


const fields = (resource: Resource) => Object.keys(resource).filter(isNot(includedIn(UNCHECKED_FIELDS)));


/**
 * Converts string values to values of other types, based on field type information.
 * No validation other than errors resulting from parsing values from strings is handled here.
 *
 * Conversion of resource done by reference, i.e. in place
 *
 * @author Daniel de Oliveira
 */
export function convertFieldTypes(type: IdaiType) { return (resource: Resource) => {

    for (let fieldName of fields(resource)) {

        const fieldDefinition = type.fields.find(on('name', is(fieldName)));
        if (!fieldDefinition) continue;

        const inputType = fieldDefinition.inputType as unknown as FieldType;
        if (resource[fieldName] !== null) convertTypeDependent(resource, fieldName, inputType);
    }

    for (let relationName of Object.keys(resource.relations).filter(isnt(PARENT))) {
        if (resource.relations[relationName] === null) continue;
        resource.relations[relationName] = (resource.relations[relationName] as unknown as string).split(ARRAY_SEPARATOR)
    }

    return resource;
}}


// here only string to number, validation in exec
const convertUnsignedInt = (container: any, path: string) => convertNumber(container, path, 'int');
const convertUnsignedFloat = (container: any, path: string) => convertNumber(container, path, 'float');
const convertFloat = (container: any, path: string) => convertNumber(container, path, 'float');



function convertTypeDependent(resource: Resource, fieldName: string, inputType: FieldType) {

    // leave 'date' as is
    // leave 'radio' as is
    if (inputType === 'boolean')       convertBoolean(resource, fieldName);
    if (inputType === 'dating')        convertDating(resource, fieldName);
    if (inputType === 'dimension')     convertDimension(resource, fieldName);
    if (inputType === 'checkboxes')    convertCheckboxes(resource, fieldName);
    if (inputType === 'unsignedInt')   convertUnsignedInt(resource, fieldName);
    if (inputType === 'unsignedFloat') convertUnsignedFloat(resource, fieldName);
    if (inputType === 'float')         convertFloat(resource, fieldName);
}


function convertCheckboxes(resource: Resource, fieldName: string) {

    resource[fieldName] = resource[fieldName].split(';');
}


function convertDimension(resource: Resource, fieldName: string) {

    let i = 0;
    for (let dimension of resource[fieldName] as Array<Dimension>) {

        if (dimension === null) continue;
        if (dimension === undefined) continue;

        try {
            convertFloat(dimension, 'value');
            convertFloat(dimension, 'rangeMin');
            convertFloat(dimension, 'rangeMax');
            convertFloat(dimension, 'inputValue');
            convertFloat(dimension, 'inputRangeEndValue');
            convertBoolean(dimension, 'isImprecise');
            convertBoolean(dimension, 'isRange');
        } catch (msgWithParams) {
            throw [msgWithParams[0], msgWithParams[1], fieldName + '.' + i + '.' + msgWithParams[2]];
        }
        i++;
    }
}


function convertDating(resource: Resource, fieldName: string) {

    let i = 0;
    for (let dating of resource[fieldName] as Array<Dating>) {

        if (dating === null) continue;
        if (dating === undefined) continue;

        try {
            convertUnsignedInt(dating, 'begin.inputYear');
            convertUnsignedInt(dating, 'end.inputYear');
            convertUnsignedInt(dating, 'margin');
            convertBoolean(dating, 'isImprecise');
            convertBoolean(dating, 'isUncertain');
        } catch (msgWithParams) {
            throw [msgWithParams[0], msgWithParams[1], fieldName + '.' + i + '.' + msgWithParams[2]];
        }
        i++;
    }
}


/**
 * Modifies container at path by converting string to number.
 * Returns early if no value at path.
 */
function convertNumber(container: any, path: string, type: 'int'|'float') {

    let value = getOn(path, undefined)(container);
    if (!value) return;

    if (type === 'float') value = value.replace(',', '.');

    const converted = type === 'int' ? parseInt(value) : parseFloat(value);
    if (isNaN(converted)) throw [ParserErrors.CSV_NOT_A_NUMBER, value, path];
    setOn(container, path)(converted);
}


/**
 * Modifies container at path by convertin string to boolan.
 * Returns early if no value at path.
 */
function convertBoolean(container: any, path: string) {

    const val = getOn(path, undefined)(container);
    if (!val) return;
    if (isNot(includedIn(['true', 'false']))(val)) throw [ParserErrors.CSV_NOT_A_BOOLEAN, val, path];
    setOn(container, path)(val === 'true');
}
