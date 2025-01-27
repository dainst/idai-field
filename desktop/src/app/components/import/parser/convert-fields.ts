import { includedIn, is, isNot, isnt, on, Path, to, clone } from 'tsfun';
import { CategoryForm, Field, Relation, InPlace, Dating, Dimension, Resource, Named } from 'idai-field-core';
import { CsvExportConsts } from '../../export/csv/csv-export-consts';
import { ParserErrors } from './parser-errors';
import ARRAY_SEPARATOR = CsvExportConsts.ARRAY_SEPARATOR;
import InputType = Field.InputType;


const UNCHECKED_FIELDS = ['relations', 'geometry', 'category'];


const fields = (resource: Resource) => Object.keys(resource).filter(isNot(includedIn(UNCHECKED_FIELDS)));


/**
 * Converts string values to values of other categories, based on the respective input type.
 * No validation other than errors resulting from parsing values from strings is handled here.
 *
 * Conversion of resource done by reference, i. e. in place
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function convertFields(category: CategoryForm) {

    return (resource: Resource) => {

        for (const fieldName of fields(resource)) {

            const field = CategoryForm.getFields(category).find(on(Field.NAME, is(fieldName)));
            if (!field) continue;

            const inputType: InputType = field.inputType;
            if (resource[fieldName] !== null) convertTypeDependent(resource, fieldName, inputType, field);
        }

        for (const relationName of Object.keys(resource.relations).filter(isnt(Relation.PARENT))) {
            if (resource.relations[relationName] === null) continue;
            resource.relations[relationName] = (resource.relations[relationName] as unknown as string).split(ARRAY_SEPARATOR)
        }

        return resource;
    }
}


// here only string to number, validation in exec
const convertInt = (container: any, path: Path) => convertNumber(container, path, 'int');

const convertFloat = (container: any, path: string) => convertNumber(container, path, 'float');


function convertTypeDependent(container: any, fieldName: string, inputType: InputType, field: Field) {

    if (inputType === InputType.BOOLEAN) convertBoolean(container, fieldName);
    if (inputType === InputType.DATING) convertDating(container, fieldName);
    if (inputType === InputType.DIMENSION) convertDimension(container, fieldName);
    if (inputType === InputType.INT || inputType === InputType.UNSIGNEDINT) convertInt(container, fieldName);
    if (inputType === InputType.FLOAT || inputType === InputType.UNSIGNEDFLOAT) convertFloat(container, fieldName);
    if (inputType === InputType.COMPOSITE) convertComposite(container, fieldName, field);
    if (inputType === InputType.CHECKBOXES || inputType === InputType.SIMPLE_MULTIINPUT) {
        convertStringArray(container, fieldName)
    };
}


function convertDimension(container: any, fieldName: string) {

    let i = 0;
    for (const dimension of container[fieldName] as Array<Dimension>) {

        if (dimension === undefined) throw 'Undefined dimension found';
        if (dimension === null) continue;

        if (dimension.inputUnit) (dimension.inputUnit as string) = dimension.inputUnit.toLowerCase();

        try {
            convertFloat(dimension, 'value');
            convertFloat(dimension, Dimension.RANGEMIN);
            convertFloat(dimension, Dimension.RANGEMAX);
            convertFloat(dimension, Dimension.INPUTVALUE);
            convertFloat(dimension, Dimension.INPUTRANGEENDVALUE);
            convertBoolean(dimension, Dimension.ISIMPRECISE);
            convertBoolean(dimension, 'isRange');
        } catch (msgWithParams) {
            throw [msgWithParams[0], msgWithParams[1], fieldName + '.' + i + '.' + msgWithParams[2]];
        }
        i++;
    }
}


function convertDating(container: any, fieldName: string) {

    let i = 0;
    for (let dating of container[fieldName] as Array<Dating>) {

        if (dating === undefined) throw 'Undefined dating found';
        if (dating === null) continue;

        if (dating.type === 'scientific') dating.begin = clone(dating.end);

        try {
            convertInt(dating, ['begin', 'inputYear']);
            convertInt(dating, ['end', 'inputYear']);
            convertInt(dating, 'margin');
            convertBoolean(dating, 'isImprecise');
            convertBoolean(dating, 'isUncertain');
        } catch (msgWithParams) {
            throw [msgWithParams[0], msgWithParams[1], fieldName + '.' + i + '.' + msgWithParams[2]];
        }
        i++;
    }
}


function convertComposite(resource: Resource, fieldName: string, field: Field) {

    resource[fieldName].forEach(element => {
        if (element === undefined) throw 'Undefined composite object found';
        if (element === null) return;

        Object.keys(element).forEach(subfieldName => {
            const inputType: InputType = field.subfields?.find(on(Named.NAME, is(subfieldName)))?.inputType;
            if (inputType) {
                convertTypeDependent(element, subfieldName, inputType, field);
            } else {
                throw 'Subfield definition not found: ' + subfieldName;
            }
        });
    });
}


function convertStringArray(container: any, fieldName: string) {

    if (!container[fieldName]) return;
    container[fieldName] = container[fieldName].split(ARRAY_SEPARATOR);
}


/**
 * Modifies container at path by converting string to number.
 * Returns early if no value at path.
 */
function convertNumber(container: any, path: Path, type: 'int'|'float') {

    let value = to(path, undefined)(container);
    if (!value) return;

    if (type === 'float') value = value.replace(',', '.');

    const converted = type === 'int' ? parseInt(value) : parseFloat(value);
    if (isNaN(converted)) throw [ParserErrors.CSV_NOT_A_NUMBER, value, path];
    InPlace.setOn(container, path)(converted);
}


/**
 * Modifies container at path by converting string to boolean.
 * Returns early if no value at path.
 */
function convertBoolean(container: any, path: Path) {

    const val = to(path, undefined)(container);
    if (!val) return;
    if (isNot(includedIn(['true', 'false']))(val)) throw [ParserErrors.CSV_NOT_A_BOOLEAN, val, path];
    InPlace.setOn(container, path)(val === 'true');
}
