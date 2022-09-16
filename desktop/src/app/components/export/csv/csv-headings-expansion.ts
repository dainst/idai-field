import { flatMap, range } from 'tsfun';
import { OptionalRange } from 'idai-field-core';
import { CsvExportConsts } from './csv-export-consts';


/**
 * @author Daniel de Oliveira
 */
export module CSVHeadingsExpansion {

    import OBJECT_SEPARATOR = CsvExportConsts.OBJECT_SEPARATOR;


    export function expandI18nStringHeadings(languages: string[]) {
        
        return (fieldName: string) => {

            return languages.map(language => {
                return fieldName + OBJECT_SEPARATOR + language
            });
        };
    }


    export function expandI18nStringArrayHeadings(languages: string[]) {

        return (n: number) => {
        
            return (fieldName: string) => {

                return flatMap(i => languages.map(language => {
                    return fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + language
                }))(range(n));
            };
        };
    }


    export function expandOptionalRangeHeadings(fieldName: string) {

        return [
            fieldName + OBJECT_SEPARATOR + OptionalRange.VALUE,
            fieldName + OBJECT_SEPARATOR + OptionalRange.ENDVALUE
        ];
    }


    export function expandDatingHeadings(languages: string[]) {
        
        return (n: number) => {

            return (fieldName: string) => {

                return flatMap(i => [
                    fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'type',
                    fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'begin.inputType',
                    fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'begin.inputYear',
                    fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'end.inputType',
                    fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'end.inputYear',
                    fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'margin',
                ].concat(languages.map(language => {
                    return fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'source' + OBJECT_SEPARATOR
                        + language;
                })).concat([
                    fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'isImprecise',
                    fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'isUncertain'
                ]))(range(n));
            }
        }
    }


    export function expandDimensionHeadings(languages: string[]) {
        
        return (n: number) => {

            return (fieldName: string) => {

                return flatMap(i => [
                    fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'inputValue',
                    fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'inputRangeEndValue',
                    fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'measurementPosition'
                ].concat(languages.map(language => {
                    return fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'measurementComment'
                        + OBJECT_SEPARATOR + language;
                })).concat([
                    fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'inputUnit',
                    fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'isImprecise'
                ]))(range(n));
            }
        }
    }


    export function expandLiteratureHeadings(_: string[]) {
        
        return (n: number) => {

            return (fieldName: string) => {

                return flatMap(i => [
                    fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'quotation',
                    fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'zenonId',
                    fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'doi',
                    fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'page',
                    fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'figure'
                ]
                )(range(n));
            }
        }
    }
}
