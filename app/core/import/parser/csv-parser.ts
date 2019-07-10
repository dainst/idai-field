import {IdaiType, Document, Resource, Dating, Dimension} from 'idai-components-2';
import {CsvRowsConversion} from './csv-rows-conversion';
import {makeLines, Parser} from './parser';
import {flow, map, on, is, isNot, includedIn} from 'tsfun';


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

            const documents = flow<any>(content,
                makeLines,
                CsvRowsConversion.parse(SEP),
                map(insertTypeName(type)), // TODO make assoc function
                map(insertIsChildOf(operationId)),
                map(convertFieldType(type)),
                map(toResource));

            return Promise.resolve(documents);
        };
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

            if (fieldDefinition.inputType === 'dating') {
                for (let dating of resource[fieldName] as Array<Dating>) {
                    // const dating = resource['dating']; // TODO should exist

                    if (dating.begin && dating.begin.year) dating.begin.year = parseInt(dating.begin.year as any); // TODO handle errors
                    if (dating.end && dating.end.year) dating.end.year = parseInt(dating.end.year as any);
                    if (dating.margin) dating.margin = parseInt(dating.margin as any);

                    if (dating.isImprecise && (dating.isImprecise as any) === 'true') dating.isImprecise = true; else dating.isImprecise = false;
                    if (dating.isUncertain && (dating.isUncertain as any) === 'true') dating.isUncertain = true; else dating.isUncertain = false;
                }
            }

            if (fieldDefinition.inputType === 'dimension') {
                for (let dimension of resource[fieldName] as Array<Dimension>) {
                    // const dimension // TODO should exist

                    if (dimension.value) dimension.value = parseInt(dimension.value as any);
                    if (dimension.rangeMin) dimension.rangeMin = parseInt(dimension.rangeMin as any);
                    if (dimension.rangeMax) dimension.rangeMax = parseInt(dimension.rangeMax as any);
                    if (dimension.inputValue) dimension.inputValue = parseInt(dimension.inputValue as any);
                    if (dimension.inputRangeEndValue) dimension.inputRangeEndValue = parseInt(dimension.inputRangeEndValue as any);
                    if (dimension.isImprecise && (dimension.isImprecise as any) === 'true') dimension.isImprecise = true; else dimension.isImprecise = false;
                    if (dimension.isRange && (dimension.isRange as any) === 'true') dimension.isRange = true; else dimension.isRange = false;
                }
            }


                    // console.log(fieldDefinition);
        }

        return resource;
    }}



}