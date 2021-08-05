import {flatMap, range} from 'tsfun';
import {OptionalRange} from 'idai-field-core';
import {CsvExportConsts} from './csv-export-consts';


/**
 * @author Daniel de Oliveira
 */
export module CSVHeadingsExpansion {

    import OBJECT_SEPARATOR = CsvExportConsts.OBJECT_SEPARATOR;

    export function expandOptionalRangeHeadings(fieldName: string) {

        return [
            fieldName + OBJECT_SEPARATOR + OptionalRange.VALUE,
            fieldName + OBJECT_SEPARATOR + OptionalRange.ENDVALUE
        ];
    }


    export function expandDatingHeadings(n: number) {

        return (fieldName: string) => {

            return flatMap(i => [
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'type',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'begin.inputType',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'begin.inputYear',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'end.inputType',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'end.inputYear',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'margin',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'source',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'isImprecise',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'isUncertain'
            ])(range(n));
        }
    }


    export function expandDimensionHeadings(n: number) {

        return (fieldName: string) => {

            return flatMap(i => [
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'inputValue',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'inputRangeEndValue',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'measurementPosition',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'measurementComment',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'inputUnit',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'isImprecise'
            ])(range(n));
        }
    }


    export function expandLiteratureHeadings(n: number) {

        return (fieldName: string) => {

            return flatMap(i => [
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'quotation',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'zenonId']
            )(range(n));
        }
    }
}
