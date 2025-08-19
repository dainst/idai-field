import { Field, fieldDoc, I18N, Relation, DateConfiguration } from 'idai-field-core';
import { CSVExport } from '../../../../../src/app/components/export/csv/csv-export';


export function makeFieldDefinitions(fieldNames: string[]) {

    return fieldNames.map(fieldName => {

        let inputType: Field.InputType = Field.InputType.SIMPLE_INPUT;
        if (fieldName.startsWith('shortDescription') || fieldName.startsWith('input')) {
            inputType = Field.InputType.INPUT;
        }
        if (fieldName.startsWith('multiInput')) inputType = Field.InputType.MULTIINPUT;
        if (fieldName.startsWith('date')) inputType = Field.InputType.DATE;
        if (fieldName.startsWith('dimension')) inputType = Field.InputType.DIMENSION;
        if (fieldName.startsWith('weight')) inputType = Field.InputType.WEIGHT;
        if (fieldName.startsWith('volume')) inputType = Field.InputType.VOLUME;
        if (fieldName.startsWith('dating')) inputType = Field.InputType.DATING;
        if (fieldName.startsWith('literature')) inputType = Field.InputType.LITERATURE;
        if (fieldName.startsWith('period')) inputType = Field.InputType.DROPDOWNRANGE;
        if (fieldName.startsWith('relation')) inputType = Field.InputType.RELATION;
        if (fieldName.startsWith('composite')) inputType = Field.InputType.COMPOSITE;
        if (fieldName.startsWith('isInstanceOf')) inputType = Field.InputType.INSTANCE_OF;

        const fieldDefinition: Field = { name: fieldName, inputType };

        if (fieldDefinition.inputType === Field.InputType.DATE) {
            fieldDefinition.dateConfiguration = {
                dataType: DateConfiguration.DataType.OPTIONAL,
                inputMode: DateConfiguration.InputMode.OPTIONAL
            };
        }

        return fieldDefinition;
    }) as Array<Field>;
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('CSVExport', () => {

    function ifResource(id: string, identifier: string, shortDescription: I18N.String, category: string) {

        return fieldDoc(shortDescription, identifier, category, id).resource;
    }


    function makeSimpleCategoryAndResource() {

        const t = makeFieldDefinitions(['identifier', 'shortDescription']);
        const resource = ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category');
        return { t: t, resource: resource };
    }


    test('create header line if documents empty', () => {

        const t = makeFieldDefinitions(['identifier', 'shortDescription', 'custom', 'id']);

        const result = CSVExport.createExportable([], t, [], ['en'], ',').exportData;
        expect(result[0]).toBe('"identifier","shortDescription.en","custom"');
    });


    test('create document line', () => {

        const { t, resource } = makeSimpleCategoryAndResource();
        const result = CSVExport.createExportable([resource], t, [], ['en'], ',').exportData;
        expect(result[0]).toEqual('"identifier","shortDescription.en"');
        expect(result[1]).toEqual('"identifier1","shortDescription1"');
    });


    test('export relations', () => {

        const fields = makeFieldDefinitions(['identifier', 'shortDescription', 'relation1']);
        const resource = ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category');
        resource.relations = { relation1: ['identifier2'] } as any;

        const result = CSVExport.createExportable([resource], fields, ['relation1', 'liesWithin'], ['en'], ',')
            .exportData;
        expect(result[0]).toBe('"identifier","shortDescription.en","relations.relation1","relations.isChildOf"');
        expect(result[1]).toBe('"identifier1","shortDescription1","identifier2",""');
    });


    test('export relations without combining hierarchical relations', () => {

        const fields = makeFieldDefinitions(['identifier', 'shortDescription', 'relation1']);
        const resource = ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category');
        resource.relations = {
            relation1: ['identifier2'], liesWithin: ['identifier3'], isRecordedIn: ['identifier4']
        } as any;

        const result = CSVExport.createExportable(
            [resource], fields, ['relation1', 'liesWithin', 'isRecordedIn'], ['en'], ',', false
        ).exportData;
        expect(result[0]).toBe('"identifier","shortDescription.en","relations.relation1","relations.liesWithin",'
            + '"relations.isRecordedIn"');
        expect(result[1]).toBe('"identifier1","shortDescription1","identifier2","identifier3","identifier4"');
    });


    test('export instanceOf field', () => {

        const fields = makeFieldDefinitions(['identifier', 'shortDescription', 'isInstanceOf']);
        const resource = ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category');
        resource.relations = { isInstanceOf: ['identifier2'] } as any;

        const result = CSVExport.createExportable([resource], fields, ['liesWithin', 'isInstanceOf'], ['en'], ',')
            .exportData;
        expect(result[0]).toBe('"identifier","shortDescription.en","relations.isInstanceOf","relations.isChildOf"');
        expect(result[1]).toBe('"identifier1","shortDescription1","identifier2",""');
    });


    function expectCorrectChildOfTarget(resource, t, expectation) {

        const result = CSVExport.createExportable([resource], t, Relation.Hierarchy.ALL, ['en'], ',').exportData;
        expect(result[0]).toBe('"identifier","shortDescription.en","relations.isChildOf"');
        expect(result[1]).toBe('"identifier1","shortDescription1",' + expectation);
    }


    test('handle double quotes in field values', () => {

        const { t, resource } = makeSimpleCategoryAndResource();
        resource.shortDescription = { en: 'ABC " "DEF"' };
        const result = CSVExport.createExportable([resource], t, [], ['en'], ',').exportData;
        expect(result[0]).toEqual('"identifier","shortDescription.en"');
        expect(result[1]).toEqual('"identifier1","ABC "" ""DEF"""');
    });


    test('export array fields', () => {

        const fields = makeFieldDefinitions(['identifier', 'shortDescription', 'color']);
        fields.find(field => field.name === 'color').inputType = 'checkboxes';
        const resource = ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category');
        resource.color = ['blue', 'red', 'yellow'];
        const result = CSVExport.createExportable([resource], fields, [], ['en'], ',').exportData;
        expect(result[0]).toEqual('"identifier","shortDescription.en","color"');
        expect(result[1]).toEqual('"identifier1","shortDescription1","blue;red;yellow"');
    });


    test('export editable value array fields', () => {

        const fields = makeFieldDefinitions(['identifier', 'shortDescription', 'staff']);
        fields.find(field => field.name === 'staff').inputType = 'valuelistMultiInput';

        const resource = ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category');
        resource.staff = [
            { value: 'Person A', selectable: true },
            { value: 'Person B', selectable: true }, 
            { value: 'Person C', selectable: false }
        ];

        const result = CSVExport.createExportable([resource], fields, [], ['en'], ',').exportData;
        expect(result[0]).toEqual('"identifier","shortDescription.en","staff"');
        expect(result[1]).toEqual('"identifier1","shortDescription1","Person A;Person B;Person C"');
    });


    test('is nested in another resource', () => {

        const { t, resource } = makeSimpleCategoryAndResource();
        resource.relations = {
            liesWithin: ['identifier2'],
            isRecordedIn: ['operation1']
        } as any;
        expectCorrectChildOfTarget(resource, t, '"identifier2"');
    });


    test('is nested in an operation', () => {

        const { t, resource } = makeSimpleCategoryAndResource();
        resource.relations = {
            isRecordedIn: ['operation1']
        } as any;
        expectCorrectChildOfTarget(resource, t, '"operation1"')
    });


    test('expand dropdownRange', () => {

        const t = makeFieldDefinitions(['identifier', 'period', 'custom']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
            ifResource('i2', 'identifier2', { en: 'shortDescription2' }, 'category'),
            ifResource('i3', 'identifier3', { en: 'shortDescription3' }, 'category')
        ];

        resources[0]['period'] = {
            value: 'A',
            endValue: 'B'
        };
        resources[1]['period'] = {
            value: 'A'
        };

        const result = CSVExport.createExportable(resources, t, [], ['en'], ',').exportData.map(row => row.split(','));

        expect(result[0][1]).toBe('"period.value"');
        expect(result[0][2]).toBe('"period.endValue"');
        expect(result[0][3]).toBe('"custom"');

        expect(result[1][1]).toBe('"A"');
        expect(result[1][2]).toBe('"B"');
        expect(result[1][3]).toBe('""');

        expect(result[2][1]).toBe('"A"');
        expect(result[2][2]).toBe('""');
        expect(result[2][3]).toBe('""');

        expect(result[3][1]).toBe('""');
        expect(result[3][2]).toBe('""');
        expect(result[3][3]).toBe('""');
    });


    test('expand multiple dropdownRanges', () => {

        const t = makeFieldDefinitions(['identifier', 'periodA', 'periodB', 'custom']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
        ];

        resources[0].periodA = { value: 'A', endValue: 'B' };
        resources[0].periodB = { value: 'C', endValue: 'D' };
        resources[0].custom = 'custom';

        const result = CSVExport.createExportable(resources, t, [], ['en'], ',').exportData.map(row => row.split(','));

        expect(result[0][1]).toBe('"periodA.value"');
        expect(result[0][2]).toBe('"periodA.endValue"');
        expect(result[0][3]).toBe('"periodB.value"');
        expect(result[0][4]).toBe('"periodB.endValue"');
        expect(result[0][5]).toBe('"custom"');

        expect(result[1][1]).toBe('"A"');
        expect(result[1][2]).toBe('"B"');
        expect(result[1][3]).toBe('"C"');
        expect(result[1][4]).toBe('"D"');
        expect(result[1][5]).toBe('"custom"');
    });


    test('expand date', () => {

        const t = makeFieldDefinitions(['identifier', 'date', 'custom']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
            ifResource('i2', 'identifier2', { en: 'shortDescription2' }, 'category'),
            ifResource('i3', 'identifier3', { en: 'shortDescription3' }, 'category'),
            ifResource('i4', 'identifier4', { en: 'shortDescription4' }, 'category')
        ];

        resources[0]['date'] = {
            value: '10.12.2023 15:10',
            endValue: '11.12.2023 14:35',
            isRange: true
        };
        resources[1]['date'] = {
            value: '02.04.2025',
            isRange: false
        };
        resources[2]['date'] = {
            value: '05.07.2015 10:24',
            isRange: true
        };
        resources[3]['date'] = {
            endValue: '07.07.2012 11:20',
            isRange: true
        };

        const result = CSVExport.createExportable(resources, t, [], ['en'], ',').exportData.map(row => row.split(','));

        expect(result[0][1]).toBe('"date.value"');
        expect(result[0][2]).toBe('"date.endValue"');
        expect(result[0][3]).toBe('"date.isRange"');
        expect(result[0][4]).toBe('"custom"');

        expect(result[1][1]).toBe('"10.12.2023 15:10"');
        expect(result[1][2]).toBe('"11.12.2023 14:35"');
        expect(result[1][3]).toBe('"true"');
        expect(result[1][4]).toBe('""');

        expect(result[2][1]).toBe('"02.04.2025"');
        expect(result[2][2]).toBe('""');
        expect(result[2][3]).toBe('"false"');
        expect(result[2][4]).toBe('""');

        expect(result[3][1]).toBe('"05.07.2015 10:24"');
        expect(result[3][2]).toBe('""');
        expect(result[3][3]).toBe('"true"');
        expect(result[3][4]).toBe('""');

        expect(result[4][1]).toBe('""');
        expect(result[4][2]).toBe('"07.07.2012 11:20"');
        expect(result[4][3]).toBe('"true"');
        expect(result[4][4]).toBe('""');
    });


    test('expand multiple dates', () => {

        const t = makeFieldDefinitions(['identifier', 'dateA', 'dateB', 'custom']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
        ];

        resources[0].dateA = {
            value: '10.12.2023',
            endValue: '11.03.2025',
            isRange: true
        };
        resources[0].dateB = {
            value: '10.01.1999 17:30',
            endValue: '20.05.2000 21:29',
            isRange: true
        };
        resources[0].custom = 'custom';

        const result = CSVExport.createExportable(resources, t, [], ['en'], ',').exportData.map(row => row.split(','));

        expect(result[0][1]).toBe('"dateA.value"');
        expect(result[0][2]).toBe('"dateA.endValue"');
        expect(result[0][3]).toBe('"dateA.isRange"');
        expect(result[0][4]).toBe('"dateB.value"');
        expect(result[0][5]).toBe('"dateB.endValue"');
        expect(result[0][6]).toBe('"dateB.isRange"');
        expect(result[0][7]).toBe('"custom"');

        expect(result[1][1]).toBe('"10.12.2023"');
        expect(result[1][2]).toBe('"11.03.2025"');
        expect(result[1][3]).toBe('"true"');
        expect(result[1][4]).toBe('"10.01.1999 17:30"');
        expect(result[1][5]).toBe('"20.05.2000 21:29"');
        expect(result[1][6]).toBe('"true"');
        expect(result[1][7]).toBe('"custom"');
    });


    test('expand dating', () => {

        const t = makeFieldDefinitions(['identifier', 'dating', 'custom']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
            ifResource('i2', 'identifier2', { en: 'shortDescription2' }, 'category'),
            ifResource('i3', 'identifier3', { en: 'shortDescription3' }, 'category')
        ];
        resources[0].dating = [
            { begin: { inputYear: 10, inputType: 'ce' }, end: { inputYear: 20, inputType: 'ce' }, type: 'range',
                source: { en: 'Source 1', de: 'Quelle 1' } },
            { begin: { inputYear: 20, inputType: 'ce' }, end: { inputYear: 30, inputType: 'ce' }, type: 'range',
                source: { en: 'Source 2' } }
        ];
        resources[1].dating = [
            { begin: { inputYear: 40, inputType: 'ce' }, end: { inputYear: 50, inputType: 'ce' }, type: 'range' }
        ];
        resources[1].custom = 'custom';

        const result = CSVExport.createExportable(resources, t, [], ['en'], ',').exportData.map(row => row.split(','));

        expect(result[0][1]).toBe('"dating.0.type"');
        expect(result[0][2]).toBe('"dating.0.begin.inputType"');
        expect(result[0][3]).toBe('"dating.0.begin.inputYear"');
        expect(result[0][4]).toBe('"dating.0.end.inputType"');
        expect(result[0][5]).toBe('"dating.0.end.inputYear"');
        expect(result[0][6]).toBe('"dating.0.margin"');
        expect(result[0][7]).toBe('"dating.0.source.en"');
        expect(result[0][8]).toBe('"dating.0.source.de"');
        expect(result[0][9]).toBe('"dating.0.isImprecise"');
        expect(result[0][10]).toBe('"dating.0.isUncertain"');
        expect(result[0][11]).toBe('"dating.1.type"');
        expect(result[0][12]).toBe('"dating.1.begin.inputType"');
        expect(result[0][13]).toBe('"dating.1.begin.inputYear"');
        expect(result[0][14]).toBe('"dating.1.end.inputType"');
        expect(result[0][15]).toBe('"dating.1.end.inputYear"');
        expect(result[0][16]).toBe('"dating.1.margin"');
        expect(result[0][17]).toBe('"dating.1.source.en"');
        expect(result[0][18]).toBe('"dating.1.source.de"');
        expect(result[0][19]).toBe('"dating.1.isImprecise"');
        expect(result[0][20]).toBe('"dating.1.isUncertain"');
        expect(result[0][21]).toBe('"custom"');

        expect(result[1][3]).toBe('"10"');
        expect(result[1][5]).toBe('"20"');
        expect(result[1][7]).toBe('"Source 1"');
        expect(result[1][8]).toBe('"Quelle 1"');
        expect(result[1][13]).toBe('"20"');
        expect(result[1][15]).toBe('"30"');
        expect(result[1][17]).toBe('"Source 2"');
        expect(result[1][18]).toBe('""');
        expect(result[1][21]).toBe('""');

        expect(result[2][3]).toBe('"40"');
        expect(result[2][5]).toBe('"50"');
        expect(result[2][7]).toBe('""');
        expect(result[2][8]).toBe('""');
        expect(result[2][13]).toBe('""');
        expect(result[2][15]).toBe('""');
        expect(result[2][17]).toBe('""');
        expect(result[2][18]).toBe('""');
        expect(result[2][21]).toBe('"custom"');

        expect(result[3][3]).toBe('""');
        expect(result[3][5]).toBe('""');
        expect(result[3][7]).toBe('""');
        expect(result[3][8]).toBe('""');
        expect(result[3][13]).toBe('""');
        expect(result[3][15]).toBe('""');
        expect(result[3][17]).toBe('""');
        expect(result[3][18]).toBe('""');
        expect(result[3][21]).toBe('""');
    });


    test('expand dating field even if no value present', () => {

        const t = makeFieldDefinitions(['identifier', 'dating']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
        ];

        const result = CSVExport.createExportable(resources, t, [], ['en'], ',').exportData.map(row => row.split(','));

        expect(result[0][1]).toBe('"dating.0.type"');
        expect(result[0][2]).toBe('"dating.0.begin.inputType"');
        expect(result[0][3]).toBe('"dating.0.begin.inputYear"');
        expect(result[0][4]).toBe('"dating.0.end.inputType"');
        expect(result[0][5]).toBe('"dating.0.end.inputYear"');
        expect(result[0][6]).toBe('"dating.0.margin"');
        expect(result[0][7]).toBe('"dating.0.source.en"');
        expect(result[0][8]).toBe('"dating.0.isImprecise"');
        expect(result[0][9]).toBe('"dating.0.isUncertain"');

        expect(result[1][1]).toBe('""');
    });


    test('expand dating field even if no value present, in header only mode', () => {

        const t = makeFieldDefinitions(['identifier', 'dating']);

        const result = CSVExport.createExportable([], t, [], ['en'], ',').exportData.map(row => row.split(','));

        expect(result[0][1]).toBe('"dating.0.type"');
        expect(result[0][2]).toBe('"dating.0.begin.inputType"');
        expect(result[0][3]).toBe('"dating.0.begin.inputYear"');
        expect(result[0][4]).toBe('"dating.0.end.inputType"');
        expect(result[0][5]).toBe('"dating.0.end.inputYear"');
        expect(result[0][6]).toBe('"dating.0.margin"');
        expect(result[0][7]).toBe('"dating.0.source.en"');
        expect(result[0][8]).toBe('"dating.0.isImprecise"');
        expect(result[0][9]).toBe('"dating.0.isUncertain"');
    });


    test('do not modify resource when expanding', () => {

        const { t, resource } = makeSimpleCategoryAndResource();
        resource.dating = [{ begin: { year: 10 }, end: { year: 20 }, source: { en: 'some1' }, label: 'content' }];

        CSVExport.createExportable([resource], t, [], ['en'], ',').exportData.map(row => row.split(','));

        expect(resource['dating'][0]['begin']['year']).toBe(10);
        expect(resource['dating'][0]['end']['year']).toBe(20);
        expect(resource['dating'][0]['source']['en']).toBe('some1');
    });


    test('do not modify resource when expanding relations', () => {

        const fields = makeFieldDefinitions(['identifier', 'shortDescription', 'relation1']);
        const resource = ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category');
        resource['relations']['relation1'] = ['abc'];

        CSVExport.createExportable([resource], fields, ['relation1'], ['en'], ',').exportData.map(row => row.split(','));

        expect(resource['relations']['relation1'][0]).toBe('abc');
    });


    test('expand dimension', () => {

        const t = makeFieldDefinitions(['identifier', 'dimensionX', 'custom']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
            ifResource('i2', 'identifier2', { en: 'shortDescription2' }, 'category'),
            ifResource('i3', 'identifier3', { en: 'shortDescription3' }, 'category'),
        ];
        resources[0]['dimensionX'] = [
            { inputValue: 100, inputUnit: 'mm', measurementComment: { en: 'Comment 1', de: 'Kommentar 1' } },
            { inputValue: 200, inputUnit: 'cm', measurementComment: { en: 'Comment 2' }, measurementPosition: 'def' }];
        resources[1]['dimensionX'] = [
            { inputValue: 300, inputUnit: 'm', inputRangeEndValue: 400 }];
        resources[1]['custom'] = 'custom';

        const result = CSVExport.createExportable(resources, t, [], ['en'], ',').exportData.map(row => row.split(','));

        expect(result[0][1]).toBe('"dimensionX.0.inputValue"');
        expect(result[0][2]).toBe('"dimensionX.0.inputRangeEndValue"');
        expect(result[0][3]).toBe('"dimensionX.0.inputUnit"');
        expect(result[0][4]).toBe('"dimensionX.0.measurementPosition"');
        expect(result[0][5]).toBe('"dimensionX.0.measurementComment.en"');
        expect(result[0][6]).toBe('"dimensionX.0.measurementComment.de"');
        expect(result[0][7]).toBe('"dimensionX.0.isImprecise"');
        expect(result[0][8]).toBe('"dimensionX.1.inputValue"');
        expect(result[0][9]).toBe('"dimensionX.1.inputRangeEndValue"');
        expect(result[0][10]).toBe('"dimensionX.1.inputUnit"');
        expect(result[0][11]).toBe('"dimensionX.1.measurementPosition"');
        expect(result[0][12]).toBe('"dimensionX.1.measurementComment.en"');
        expect(result[0][13]).toBe('"dimensionX.1.measurementComment.de"');
        expect(result[0][14]).toBe('"dimensionX.1.isImprecise"');
        expect(result[0][15]).toBe('"custom"');

        expect(result[1][1]).toBe('"100"');
        expect(result[1][2]).toBe('""');
        expect(result[1][3]).toBe('"mm"');
        expect(result[1][4]).toBe('""');
        expect(result[1][5]).toBe('"Comment 1"');
        expect(result[1][6]).toBe('"Kommentar 1"');
        expect(result[1][7]).toBe('""');
        expect(result[1][8]).toBe('"200"');
        expect(result[1][9]).toBe('""');
        expect(result[1][10]).toBe('"cm"');
        expect(result[1][11]).toBe('"def"');
        expect(result[1][12]).toBe('"Comment 2"');
        expect(result[1][13]).toBe('""');
        expect(result[1][14]).toBe('""');
        expect(result[1][15]).toBe('""');

        expect(result[2][1]).toBe('"300"');
        expect(result[2][2]).toBe('"400"');
        expect(result[2][3]).toBe('"m"');
        expect(result[2][4]).toBe('""');
        expect(result[2][5]).toBe('""');
        expect(result[2][6]).toBe('""');
        expect(result[2][7]).toBe('""');
        expect(result[2][8]).toBe('""');
        expect(result[2][9]).toBe('""');
        expect(result[2][10]).toBe('""');
        expect(result[2][11]).toBe('""');
        expect(result[2][12]).toBe('""');
        expect(result[2][13]).toBe('""');
        expect(result[2][14]).toBe('""');
        expect(result[2][15]).toBe('"custom"');

        expect(result[3][1]).toBe('""');
        expect(result[3][2]).toBe('""');
        expect(result[3][3]).toBe('""');
        expect(result[3][4]).toBe('""');
        expect(result[3][5]).toBe('""');
        expect(result[3][6]).toBe('""');
        expect(result[3][7]).toBe('""');
        expect(result[3][8]).toBe('""');
        expect(result[3][9]).toBe('""');
        expect(result[3][10]).toBe('""');
        expect(result[3][11]).toBe('""');
        expect(result[3][12]).toBe('""');
        expect(result[3][13]).toBe('""');
        expect(result[3][14]).toBe('""');
        expect(result[3][15]).toBe('""');
    });


    test('expand one dimension field even if no values present', () => {

        const t = makeFieldDefinitions(['identifier', 'dimensionX']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
        ];

        const result = CSVExport.createExportable(resources, t, [], ['en'], ',').exportData.map(row => row.split(','));

        expect(result[0][1]).toBe('"dimensionX.0.inputValue"');
        expect(result[0][2]).toBe('"dimensionX.0.inputRangeEndValue"');
        expect(result[0][3]).toBe('"dimensionX.0.inputUnit"');
        expect(result[0][4]).toBe('"dimensionX.0.measurementPosition"');
        expect(result[0][5]).toBe('"dimensionX.0.measurementComment.en"');
        expect(result[0][6]).toBe('"dimensionX.0.isImprecise"');

        expect(result[1][1]).toBe('""');
    });


    test('expand one dimension field even if no values present, in header only mode', () => {

        const t = makeFieldDefinitions(['identifier', 'dimensionX']);

        const result = CSVExport.createExportable([], t, [], ['en'], ',').exportData.map(row => row.split(','));

        expect(result[0][1]).toBe('"dimensionX.0.inputValue"');
        expect(result[0][2]).toBe('"dimensionX.0.inputRangeEndValue"');
        expect(result[0][3]).toBe('"dimensionX.0.inputUnit"');
        expect(result[0][4]).toBe('"dimensionX.0.measurementPosition"');
        expect(result[0][5]).toBe('"dimensionX.0.measurementComment.en"');
        expect(result[0][6]).toBe('"dimensionX.0.isImprecise"');
    });


    test('expand multiple dimension fields', () => {

        const t = makeFieldDefinitions(['identifier', 'dimensionX', 'dimensionY']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
            ifResource('i2', 'identifier2', { en: 'shortDescription2' }, 'category'),
        ];
        resources[0]['dimensionX'] = [{ inputValue: 100, inputUnit: 'cm',
            measurementComment: { en: 'A1', de: 'A2' } }];
        resources[1]['dimensionY'] = [{ inputValue: 300, inputUnit: 'cm', inputRangeEndValue: 400,
            measurementComment: 'B' }];

        const result = CSVExport.createExportable(resources, t, [], ['en'], ',').exportData.map(row => row.split(','));

        expect(result[0][1]).toBe('"dimensionX.0.inputValue"');
        expect(result[0][2]).toBe('"dimensionX.0.inputRangeEndValue"');
        expect(result[0][3]).toBe('"dimensionX.0.inputUnit"');
        expect(result[0][4]).toBe('"dimensionX.0.measurementPosition"');
        expect(result[0][5]).toBe('"dimensionX.0.measurementComment.en"');
        expect(result[0][6]).toBe('"dimensionX.0.measurementComment.de"');
        expect(result[0][7]).toBe('"dimensionX.0.isImprecise"');
        expect(result[0][8]).toBe('"dimensionY.0.inputValue"');
        expect(result[0][9]).toBe('"dimensionY.0.inputRangeEndValue"');
        expect(result[0][10]).toBe('"dimensionY.0.inputUnit"');
        expect(result[0][11]).toBe('"dimensionY.0.measurementPosition"');
        expect(result[0][12]).toBe('"dimensionY.0.measurementComment.en"');
        expect(result[0][13]).toBe('"dimensionY.0.measurementComment.unspecifiedLanguage"');
        expect(result[0][14]).toBe('"dimensionY.0.isImprecise"');

        expect(result[1][1]).toBe('"100"');
        expect(result[1][5]).toBe('"A1"');
        expect(result[1][6]).toBe('"A2"');
        expect(result[2][8]).toBe('"300"');
        expect(result[2][9]).toBe('"400"');
        expect(result[2][12]).toBe('""');
        expect(result[2][13]).toBe('"B"');
    });


    test('expand weight', () => {

        const t = makeFieldDefinitions(['identifier', 'weight', 'custom']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
            ifResource('i2', 'identifier2', { en: 'shortDescription2' }, 'category'),
            ifResource('i3', 'identifier3', { en: 'shortDescription3' }, 'category'),
        ];
        resources[0]['weight'] = [
            { inputValue: 100, inputUnit: 'mg', measurementComment: { en: 'Comment 1', de: 'Kommentar 1' } },
            { inputValue: 200, inputUnit: 'g', measurementComment: { en: 'Comment 2' }, measurementScale: 'abc' }
        ];
        resources[1]['weight'] = [
            { inputValue: 300, inputUnit: 'kg', inputRangeEndValue: 400 }
        ];
        resources[1]['custom'] = 'custom';

        const result = CSVExport.createExportable(resources, t, [], ['en'], ',').exportData.map(row => row.split(','));

        expect(result[0][1]).toBe('"weight.0.inputValue"');
        expect(result[0][2]).toBe('"weight.0.inputRangeEndValue"');
        expect(result[0][3]).toBe('"weight.0.inputUnit"');
        expect(result[0][4]).toBe('"weight.0.measurementScale"');
        expect(result[0][5]).toBe('"weight.0.measurementComment.en"');
        expect(result[0][6]).toBe('"weight.0.measurementComment.de"');
        expect(result[0][7]).toBe('"weight.0.isImprecise"');
        expect(result[0][8]).toBe('"weight.1.inputValue"');
        expect(result[0][9]).toBe('"weight.1.inputRangeEndValue"');
        expect(result[0][10]).toBe('"weight.1.inputUnit"');
        expect(result[0][11]).toBe('"weight.1.measurementScale"');
        expect(result[0][12]).toBe('"weight.1.measurementComment.en"');
        expect(result[0][13]).toBe('"weight.1.measurementComment.de"');
        expect(result[0][14]).toBe('"weight.1.isImprecise"');
        expect(result[0][15]).toBe('"custom"');

        expect(result[1][1]).toBe('"100"');
        expect(result[1][2]).toBe('""');
        expect(result[1][3]).toBe('"mg"');
        expect(result[1][4]).toBe('""');
        expect(result[1][5]).toBe('"Comment 1"');
        expect(result[1][6]).toBe('"Kommentar 1"');
        expect(result[1][7]).toBe('""');
        expect(result[1][8]).toBe('"200"');
        expect(result[1][9]).toBe('""');
        expect(result[1][10]).toBe('"g"');
        expect(result[1][11]).toBe('"abc"');
        expect(result[1][12]).toBe('"Comment 2"');
        expect(result[1][13]).toBe('""');
        expect(result[1][14]).toBe('""');
        expect(result[1][15]).toBe('""');

        expect(result[2][1]).toBe('"300"');
        expect(result[2][2]).toBe('"400"');
        expect(result[2][3]).toBe('"kg"');
        expect(result[2][4]).toBe('""');
        expect(result[2][5]).toBe('""');
        expect(result[2][6]).toBe('""');
        expect(result[2][7]).toBe('""');
        expect(result[2][8]).toBe('""');
        expect(result[2][9]).toBe('""');
        expect(result[2][10]).toBe('""');
        expect(result[2][11]).toBe('""');
        expect(result[2][12]).toBe('""');
        expect(result[2][13]).toBe('""');
        expect(result[2][14]).toBe('""');
        expect(result[2][15]).toBe('"custom"');

        expect(result[3][1]).toBe('""');
        expect(result[3][2]).toBe('""');
        expect(result[3][3]).toBe('""');
        expect(result[3][4]).toBe('""');
        expect(result[3][5]).toBe('""');
        expect(result[3][6]).toBe('""');
        expect(result[3][7]).toBe('""');
        expect(result[3][8]).toBe('""');
        expect(result[3][9]).toBe('""');
        expect(result[3][10]).toBe('""');
        expect(result[3][11]).toBe('""');
        expect(result[3][12]).toBe('""');
        expect(result[3][13]).toBe('""');
        expect(result[3][14]).toBe('""');
        expect(result[3][15]).toBe('""');
    });


    test('expand volume', () => {

        const t = makeFieldDefinitions(['identifier', 'volume', 'custom']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
            ifResource('i2', 'identifier2', { en: 'shortDescription2' }, 'category'),
            ifResource('i3', 'identifier3', { en: 'shortDescription3' }, 'category'),
        ];
        resources[0]['volume'] = [
            { inputValue: 100, inputUnit: 'ml', measurementComment: { en: 'Comment 1', de: 'Kommentar 1' } },
            { inputValue: 200, inputUnit: 'ml', measurementComment: { en: 'Comment 2' } }
        ];
        resources[1]['volume'] = [
            { inputValue: 300, inputUnit: 'l', inputRangeEndValue: 400 }
        ];
        resources[1]['custom'] = 'custom';

        const result = CSVExport.createExportable(resources, t, [], ['en'], ',').exportData.map(row => row.split(','));

        expect(result[0][1]).toBe('"volume.0.inputValue"');
        expect(result[0][2]).toBe('"volume.0.inputRangeEndValue"');
        expect(result[0][3]).toBe('"volume.0.inputUnit"');
        expect(result[0][4]).toBe('"volume.0.measurementComment.en"');
        expect(result[0][5]).toBe('"volume.0.measurementComment.de"');
        expect(result[0][6]).toBe('"volume.0.isImprecise"');
        expect(result[0][7]).toBe('"volume.1.inputValue"');
        expect(result[0][8]).toBe('"volume.1.inputRangeEndValue"');
        expect(result[0][9]).toBe('"volume.1.inputUnit"');
        expect(result[0][10]).toBe('"volume.1.measurementComment.en"');
        expect(result[0][11]).toBe('"volume.1.measurementComment.de"');
        expect(result[0][12]).toBe('"volume.1.isImprecise"');
        expect(result[0][13]).toBe('"custom"');

        expect(result[1][1]).toBe('"100"');
        expect(result[1][2]).toBe('""');
        expect(result[1][3]).toBe('"ml"');
        expect(result[1][4]).toBe('"Comment 1"');
        expect(result[1][5]).toBe('"Kommentar 1"');
        expect(result[1][6]).toBe('""');
        expect(result[1][7]).toBe('"200"');
        expect(result[1][8]).toBe('""');
        expect(result[1][9]).toBe('"ml"');
        expect(result[1][10]).toBe('"Comment 2"');
        expect(result[1][11]).toBe('""');
        expect(result[1][12]).toBe('""');
        expect(result[1][13]).toBe('""');

        expect(result[2][1]).toBe('"300"');
        expect(result[2][2]).toBe('"400"');
        expect(result[2][3]).toBe('"l"');
        expect(result[2][4]).toBe('""');
        expect(result[2][5]).toBe('""');
        expect(result[2][6]).toBe('""');
        expect(result[2][7]).toBe('""');
        expect(result[2][8]).toBe('""');
        expect(result[2][9]).toBe('""');
        expect(result[2][10]).toBe('""');
        expect(result[2][11]).toBe('""');
        expect(result[2][12]).toBe('""');
        expect(result[2][13]).toBe('"custom"');

        expect(result[3][1]).toBe('""');
        expect(result[3][2]).toBe('""');
        expect(result[3][3]).toBe('""');
        expect(result[3][4]).toBe('""');
        expect(result[3][5]).toBe('""');
        expect(result[3][6]).toBe('""');
        expect(result[3][7]).toBe('""');
        expect(result[3][8]).toBe('""');
        expect(result[3][9]).toBe('""');
        expect(result[3][10]).toBe('""');
        expect(result[3][11]).toBe('""');
        expect(result[3][12]).toBe('""');
        expect(result[3][13]).toBe('""');
    });


    test('expand literature', () => {

        const t = makeFieldDefinitions(['identifier', 'literature']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
            ifResource('i2', 'identifier2', { en: 'shortDescription2' }, 'category')
        ];
        resources[0].literature = [
            { quotation: 'Quotation 1', zenonId: '1234567' },
            { quotation: 'Quotation 2' } ];
        resources[1].literature = [
            { quotation: 'Quotation 3', zenonId: '7654321', doi: 'https://www.example.de', page: '12', figure: '1' }
        ];

        const result = CSVExport.createExportable(resources, t, [], ['en'], ',').exportData.map(row => row.split(','));

        expect(result[0][1]).toBe('"literature.0.quotation"');
        expect(result[0][2]).toBe('"literature.0.zenonId"');
        expect(result[0][3]).toBe('"literature.0.doi"');
        expect(result[0][4]).toBe('"literature.0.page"');
        expect(result[0][5]).toBe('"literature.0.figure"');
        expect(result[0][6]).toBe('"literature.1.quotation"');
        expect(result[0][7]).toBe('"literature.1.zenonId"');
        expect(result[0][8]).toBe('"literature.1.doi"');
        expect(result[0][9]).toBe('"literature.1.page"');
        expect(result[0][10]).toBe('"literature.1.figure"');

        expect(result[1][1]).toBe('"Quotation 1"');
        expect(result[1][2]).toBe('"1234567"');
        expect(result[1][3]).toBe('""');
        expect(result[1][4]).toBe('""');
        expect(result[1][5]).toBe('""');
        expect(result[1][6]).toBe('"Quotation 2"');
        expect(result[1][7]).toBe('""');
        expect(result[1][8]).toBe('""');
        expect(result[1][9]).toBe('""');
        expect(result[1][10]).toBe('""');

        expect(result[2][1]).toBe('"Quotation 3"');
        expect(result[2][2]).toBe('"7654321"');
        expect(result[2][3]).toBe('"https://www.example.de"');
        expect(result[2][4]).toBe('"12"');
        expect(result[2][5]).toBe('"1"');
    });


    test('expand composite fields', () => {

        const fieldDefinitions: Array<Field> = makeFieldDefinitions(['identifier', 'composite']);
        fieldDefinitions[1].subfields = [
            { name: 'subfield1', inputType: 'int' },
            { name: 'subfield2', inputType: 'input' },
            { name: 'subfield3', inputType: 'boolean' },
            { name: 'subfield4', inputType: 'checkboxes' }
        ]

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
            ifResource('i2', 'identifier2', { en: 'shortDescription2' }, 'category'),
            ifResource('i3', 'identifier3', { en: 'shortDescription3' }, 'category')
        ];
        resources[0]['composite'] = [
            { 
                subfield1: 1, subfield2: { en: 'Test content 1', de: 'Testinhalt 1' }, subfield3: true,
                subfield4: ['value1', 'value2']
            },
            { subfield3: false }
        ];
        resources[1]['composite'] = [
            { subfield1: 2, subfield2: { en: 'Test content 2', de: 'Testinhalt 2' } }
        ];

        const result = CSVExport.createExportable(resources, fieldDefinitions, [], ['de', 'en'], ',')
            .exportData.map(row => row.split(','));

        expect(result[0][1]).toBe('"composite.0.subfield1"');
        expect(result[0][2]).toBe('"composite.0.subfield2.de"');
        expect(result[0][3]).toBe('"composite.0.subfield2.en"');
        expect(result[0][4]).toBe('"composite.0.subfield3"');
        expect(result[0][5]).toBe('"composite.0.subfield4"');
        expect(result[0][6]).toBe('"composite.1.subfield1"');
        expect(result[0][7]).toBe('"composite.1.subfield2.de"');
        expect(result[0][8]).toBe('"composite.1.subfield2.en"');
        expect(result[0][9]).toBe('"composite.1.subfield3"');
        expect(result[0][10]).toBe('"composite.1.subfield4"');

        expect(result[1][1]).toBe('"1"');
        expect(result[1][2]).toBe('"Testinhalt 1"');
        expect(result[1][3]).toBe('"Test content 1"');
        expect(result[1][4]).toBe('"true"');
        expect(result[1][5]).toBe('"value1;value2"');
        expect(result[1][6]).toBe('""');
        expect(result[1][7]).toBe('""');
        expect(result[1][8]).toBe('""');
        expect(result[1][9]).toBe('"false"');
        expect(result[1][10]).toBe('""');

        expect(result[2][1]).toBe('"2"');
        expect(result[2][2]).toBe('"Testinhalt 2"');
        expect(result[2][3]).toBe('"Test content 2"');
        expect(result[2][4]).toBe('""');
        expect(result[2][5]).toBe('""');
        expect(result[2][6]).toBe('""');
        expect(result[2][7]).toBe('""');
        expect(result[2][8]).toBe('""');
        expect(result[2][9]).toBe('""');
        expect(result[2][10]).toBe('""');

        expect(result[3][1]).toBe('""');
        expect(result[3][2]).toBe('""');
        expect(result[3][3]).toBe('""');
        expect(result[3][4]).toBe('""');
        expect(result[3][5]).toBe('""');
        expect(result[3][6]).toBe('""');
        expect(result[3][7]).toBe('""');
        expect(result[3][8]).toBe('""');
        expect(result[3][9]).toBe('""');
        expect(result[3][10]).toBe('""');
    });


    test('expand one composite field even if no values present', () => {

        const fieldDefinitions: Array<Field> = makeFieldDefinitions(['identifier', 'composite']);
        fieldDefinitions[1].subfields = [
            { name: 'subfield1', inputType: 'int' },
            { name: 'subfield2', inputType: 'input' }
        ]

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
        ];

        const result = CSVExport.createExportable(resources, fieldDefinitions, [], ['en'], ',')
            .exportData.map(row => row.split(','));

        expect(result[0][1]).toBe('"composite.0.subfield1"');
        expect(result[0][2]).toBe('"composite.0.subfield2.en"');

        expect(result[1][1]).toBe('""');
    });


    test('expand one composite field even if no values present, in header only mode', () => {

        const fieldDefinitions: Array<Field> = makeFieldDefinitions(['identifier', 'composite']);
        fieldDefinitions[1].subfields = [
            { name: 'subfield1', inputType: 'int' },
            { name: 'subfield2', inputType: 'input' }
        ]

        const result = CSVExport.createExportable([], fieldDefinitions, [], ['en'], ',')
            .exportData.map(row => row.split(','));

        expect(result[0][1]).toBe('"composite.0.subfield1"');
        expect(result[0][2]).toBe('"composite.0.subfield2.en"');
    });


    test('expand i18n strings', () => {

        const t = makeFieldDefinitions(['identifier', 'input1', 'input2', 'input3']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
            ifResource('i2', 'identifier2', { en: 'shortDescription2' }, 'category')
        ];
        resources[0].input1 = { de: 'A', en: 'B' };
        resources[0].input2 = { de: 'C' };
        resources[1].input1 = { it: 'D' };
        resources[1].input2 = 'E';

        const result = CSVExport.createExportable(resources, t, [], ['de', 'en'], ',').exportData
            .map(row => row.split(','));

        expect(result[0].length).toBe(9);
        expect(result[0][1]).toBe('"input1.de"');
        expect(result[0][2]).toBe('"input1.en"');
        expect(result[0][3]).toBe('"input1.it"');
        expect(result[0][4]).toBe('"input2.de"');
        expect(result[0][5]).toBe('"input2.en"');
        expect(result[0][6]).toBe('"input2.unspecifiedLanguage"');
        expect(result[0][7]).toBe('"input3.de"');
        expect(result[0][8]).toBe('"input3.en"');

        expect(result[1].length).toBe(9);
        expect(result[1][1]).toBe('"A"');
        expect(result[1][2]).toBe('"B"');
        expect(result[1][3]).toBe('""');
        expect(result[1][4]).toBe('"C"');
        expect(result[1][5]).toBe('""');
        expect(result[1][6]).toBe('""');
        expect(result[1][7]).toBe('""');
        expect(result[1][8]).toBe('""');

        expect(result[2].length).toBe(9);
        expect(result[2][1]).toBe('""');
        expect(result[2][2]).toBe('""');
        expect(result[2][3]).toBe('"D"');
        expect(result[2][4]).toBe('""');
        expect(result[2][5]).toBe('""');
        expect(result[2][6]).toBe('"E"');
        expect(result[2][7]).toBe('""');
        expect(result[2][8]).toBe('""');
    });


    test('expand i18n string arrays', () => {

        const t = makeFieldDefinitions(['identifier', 'multiInput1', 'multiInput2']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
            ifResource('i2', 'identifier2', { en: 'shortDescription2' }, 'category'),
        ];
        resources[0].multiInput1 = [{ de: 'A', en: 'B' }, { de: 'C', en: 'D' }];
        resources[0].multiInput2 = [{ de: 'E', en: 'F' }];
        resources[1].multiInput1 = [{ it: 'G' }, { de: 'H', en: 'I' }, { de: 'J' }];
        resources[1].multiInput2 = ['K'];

        const result = CSVExport.createExportable(resources, t, [], ['de', 'en'], ',').exportData
            .map(row => row.split(','));

        expect(result[0][1]).toBe('"multiInput1.0.de"');
        expect(result[0][2]).toBe('"multiInput1.0.en"');
        expect(result[0][3]).toBe('"multiInput1.0.it"');
        expect(result[0][4]).toBe('"multiInput1.1.de"');
        expect(result[0][5]).toBe('"multiInput1.1.en"');
        expect(result[0][6]).toBe('"multiInput1.1.it"');
        expect(result[0][7]).toBe('"multiInput1.2.de"');
        expect(result[0][8]).toBe('"multiInput1.2.en"');
        expect(result[0][9]).toBe('"multiInput1.2.it"');
        expect(result[0][10]).toBe('"multiInput2.0.de"');
        expect(result[0][11]).toBe('"multiInput2.0.en"');
        expect(result[0][12]).toBe('"multiInput2.0.unspecifiedLanguage"');

        expect(result[1][1]).toBe('"A"');
        expect(result[1][2]).toBe('"B"');
        expect(result[1][3]).toBe('""');
        expect(result[1][4]).toBe('"C"');
        expect(result[1][5]).toBe('"D"');
        expect(result[1][6]).toBe('""');
        expect(result[1][7]).toBe('""');
        expect(result[1][8]).toBe('""');
        expect(result[1][9]).toBe('""');
        expect(result[1][10]).toBe('"E"');
        expect(result[1][11]).toBe('"F"');
        expect(result[1][12]).toBe('""');

        expect(result[2][1]).toBe('""');
        expect(result[2][2]).toBe('""');
        expect(result[2][3]).toBe('"G"');
        expect(result[2][4]).toBe('"H"');
        expect(result[2][5]).toBe('"I"');
        expect(result[2][6]).toBe('""');
        expect(result[2][7]).toBe('"J"');
        expect(result[2][8]).toBe('""');
        expect(result[2][9]).toBe('""');
        expect(result[2][10]).toBe('""');
        expect(result[2][11]).toBe('""');
        expect(result[2][12]).toBe('"K"');
    });


    test('do not add language suffixes for projects without configured project languages', () => {

        const t = makeFieldDefinitions(['identifier', 'input', 'multiInput']);

        const resources = [
            ifResource('i1', 'identifier1', undefined, 'category')
        ];
        resources[0].input = 'A';
        resources[0].multiInput = ['B', 'C'];

        const result = CSVExport.createExportable(resources, t, [], [], ',').exportData.map(row => row.split(','));

        expect(result[0].length).toBe(4);
        expect(result[0][1]).toBe('"input"');
        expect(result[0][2]).toBe('"multiInput.0"');
        expect(result[0][3]).toBe('"multiInput.1"');

        expect(result[1].length).toBe(4);
        expect(result[1][1]).toBe('"A"');
        expect(result[1][2]).toBe('"B"');
        expect(result[1][3]).toBe('"C"');
    });


    test('expand one i18n field even if no project languages are configured, in header only mode', () => {

        const t = makeFieldDefinitions(['identifier', 'input']);
        const result = CSVExport.createExportable([], t, [], [], ',').exportData.map(row => row.split(','));

        expect(result[0][1]).toBe('"input"');
    });


    test('export scan code', () => {

        const { t, resource } = makeSimpleCategoryAndResource();
        resource.scanCode = '1234567';

        const result = CSVExport.createExportable([resource], t, [], ['en'], ',', true, true).exportData;

        expect(result[0]).toEqual('"identifier","shortDescription.en","scanCode"');
        expect(result[1]).toEqual('"identifier1","shortDescription1","1234567"');
    });
});
