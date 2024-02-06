import { Field, fieldDoc, I18N, Relation } from 'idai-field-core';
import { CSVExport } from '../../../../../src/app/components/export/csv/csv-export';


export function makeFieldDefinitions(fieldNames: string[]) {

    return fieldNames.map(fieldName => {

        let inputType = 'simpleInput';
        if (fieldName.startsWith('shortDescription') || fieldName.startsWith('input')) inputType = 'input';
        if (fieldName.startsWith('multiInput')) inputType = 'multiInput';
        if (fieldName.startsWith('dimension')) inputType = 'dimension';
        if (fieldName.startsWith('dating')) inputType = 'dating';
        if (fieldName.startsWith('literature')) inputType = 'literature';
        if (fieldName.startsWith('period')) inputType = 'dropdownRange';
        if (fieldName.startsWith('relation')) inputType = 'relation';
        if (fieldName.startsWith('composite')) inputType = 'composite';

        return { name: fieldName, inputType: inputType };
    }) as Array<Field>;
}


/**
 * @author Daniel de Oliveira
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


    it('create header line if documents empty', () => {

        const t = makeFieldDefinitions(['identifier', 'shortDescription', 'custom', 'id']);

        const result = CSVExport.createExportable([], t, [], ['en']).csvData;
        expect(result[0]).toBe('"identifier","shortDescription.en","custom"');
    });


    it('create document line', () => {

        const { t, resource } = makeSimpleCategoryAndResource();
        const result = CSVExport.createExportable([resource], t, [], ['en']).csvData;
        expect(result[0]).toEqual('"identifier","shortDescription.en"');
        expect(result[1]).toEqual('"identifier1","shortDescription1"');
    });


    it('export relations', () => {

        const fields = makeFieldDefinitions(['identifier', 'shortDescription', 'relation1']);
        const resource = ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category');
        resource.relations = { relation1: ['identifier2'] } as any;

        const result = CSVExport.createExportable([resource], fields, ['relation1', 'liesWithin'], ['en']).csvData;
        expect(result[0]).toBe('"identifier","shortDescription.en","relations.relation1","relations.isChildOf"');
        expect(result[1]).toBe('"identifier1","shortDescription1","identifier2",""');
    });


    it('export relations without combining hierarchical relations', () => {

        const fields = makeFieldDefinitions(['identifier', 'shortDescription', 'relation1']);
        const resource = ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category');
        resource.relations = {
            relation1: ['identifier2'], liesWithin: ['identifier3'], isRecordedIn: ['identifier4']
        } as any;

        const result = CSVExport.createExportable(
            [resource], fields, ['relation1', 'liesWithin', 'isRecordedIn'], ['en'], false
        ).csvData;
        expect(result[0]).toBe('"identifier","shortDescription.en","relations.relation1","relations.liesWithin",'
            + '"relations.isRecordedIn"');
        expect(result[1]).toBe('"identifier1","shortDescription1","identifier2","identifier3","identifier4"');
    });


    function expectCorrectChildOfTarget(resource, t, expectation) {

        const result = CSVExport.createExportable([resource], t, Relation.Hierarchy.ALL, ['en']).csvData;
        expect(result[0]).toBe('"identifier","shortDescription.en","relations.isChildOf"');
        expect(result[1]).toBe('"identifier1","shortDescription1",' + expectation);
    }


    it('handle double quotes in field values', () => {

        const { t, resource } = makeSimpleCategoryAndResource();
        resource.shortDescription = { en: 'ABC " "DEF"' };
        const result = CSVExport.createExportable([resource], t, [], ['en']).csvData;
        expect(result[0]).toEqual('"identifier","shortDescription.en"');
        expect(result[1]).toEqual('"identifier1","ABC "" ""DEF"""');
    });


    it('export array fields', () => {

        const fields = makeFieldDefinitions(['identifier', 'shortDescription', 'color']);
        fields.find(field => field.name === 'color').inputType = 'checkboxes';
        const resource = ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category');
        resource.color = ['blue', 'red', 'yellow'];
        const result = CSVExport.createExportable([resource], fields, [], ['en']).csvData;
        expect(result[0]).toEqual('"identifier","shortDescription.en","color"');
        expect(result[1]).toEqual('"identifier1","shortDescription1","blue;red;yellow"');
    });


    it('is nested in another resource', () => {

        const { t, resource } = makeSimpleCategoryAndResource();
        resource.relations = {
            liesWithin: ['identifier2'],
            isRecordedIn: ['operation1']
        } as any;
        expectCorrectChildOfTarget(resource, t, '"identifier2"');
    });


    it('is nested in an operation', () => {

        const { t, resource } = makeSimpleCategoryAndResource();
        resource.relations = {
            isRecordedIn: ['operation1']
        } as any;
        expectCorrectChildOfTarget(resource, t, '"operation1"')
    });


    it('expand dropdownRange', () => {

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

        const result = CSVExport.createExportable(resources, t, [], ['en']).csvData.map(row => row.split(','));

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


    it('expand multiple dropdownRanges', () => {

        const t = makeFieldDefinitions(['identifier', 'periodA', 'periodB', 'custom']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
        ];

        resources[0].periodA = { value: 'A', endValue: 'B' };
        resources[0].periodB = { value: 'C', endValue: 'D' };
        resources[0].custom = 'custom';

        const result = CSVExport.createExportable(resources, t, [], ['en']).csvData.map(row => row.split(','));

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


    it('expand dating', () => {

        const t = makeFieldDefinitions(['identifier', 'dating', 'custom']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
            ifResource('i2', 'identifier2', { en: 'shortDescription2' }, 'category'),
            ifResource('i3', 'identifier3', { en: 'shortDescription3' }, 'category')
        ];
        resources[0].dating = [
            { begin: { inputYear: 10 }, end: { inputYear: 20 }, type: 'range',
                source: { en: 'Source 1', de: 'Quelle 1' } },
            { begin: { inputYear: 20 }, end: { inputYear: 30 }, type: 'range', source: { en: 'Source 2' } }
        ];
        resources[1].dating = [
            { begin: { inputYear: 40 }, end: { inputYear: 50 }, type: 'range' }
        ];
        resources[1].custom = 'custom';

        const result = CSVExport.createExportable(resources, t, [], ['en']).csvData.map(row => row.split(','));

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


    it('expand dating field even if no value present', () => {

        const t = makeFieldDefinitions(['identifier', 'dating']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
        ];

        const result = CSVExport.createExportable(resources, t, [], ['en']).csvData.map(row => row.split(','));

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


    it('expand dating field even if no value present, in header only mode', () => {

        const t = makeFieldDefinitions(['identifier', 'dating']);

        const result = CSVExport.createExportable([], t, [], ['en']).csvData.map(row => row.split(','));

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


    it('do not modify resource when expanding', () => {

        const { t, resource } = makeSimpleCategoryAndResource();
        resource.dating = [{ begin: { year: 10 }, end: { year: 20 }, source: { en: 'some1' }, label: 'blablabla1' }];

        CSVExport.createExportable([resource], t, [], ['en']).csvData.map(row => row.split(','));

        expect(resource['dating'][0]['begin']['year']).toBe(10);
        expect(resource['dating'][0]['end']['year']).toBe(20);
        expect(resource['dating'][0]['source']['en']).toBe('some1');
    });


    it('do not modify resource when expanding relations', () => {

        const fields = makeFieldDefinitions(['identifier', 'shortDescription', 'relation1']);
        const resource = ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category');
        resource['relations']['relation1'] = ['abc'];

        CSVExport.createExportable([resource], fields, ['relation1'], ['en']).csvData.map(row => row.split(','));

        expect(resource['relations']['relation1'][0]).toBe('abc');
    });


    it('expand dimension', () => {

        const t = makeFieldDefinitions(['identifier', 'dimensionX', 'custom']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
            ifResource('i2', 'identifier2', { en: 'shortDescription2' }, 'category'),
            ifResource('i3', 'identifier3', { en: 'shortDescription3' }, 'category'),
        ];
        resources[0]['dimensionX'] = [
            { inputValue: 100, inputUnit: 'cm', measurementComment: { en: 'Comment 1', de: 'Kommentar 1' } },
            { inputValue: 200, inputUnit: 'cm', measurementComment: { en: 'Comment 2' }, measurementPosition: 'def' }];
        resources[1]['dimensionX'] = [
            { inputValue: 300, inputUnit: 'cm', inputRangeEndValue: 'ghc' }];
        resources[1]['custom'] = 'custom';

        const result = CSVExport.createExportable(resources, t, [], ['en']).csvData.map(row => row.split(','));

        expect(result[0][1]).toBe('"dimensionX.0.inputValue"');
        expect(result[0][2]).toBe('"dimensionX.0.inputRangeEndValue"');
        expect(result[0][3]).toBe('"dimensionX.0.measurementPosition"');
        expect(result[0][4]).toBe('"dimensionX.0.measurementComment.en"');
        expect(result[0][5]).toBe('"dimensionX.0.measurementComment.de"');
        expect(result[0][6]).toBe('"dimensionX.0.inputUnit"');
        expect(result[0][7]).toBe('"dimensionX.0.isImprecise"');
        expect(result[0][8]).toBe('"dimensionX.1.inputValue"');
        expect(result[0][9]).toBe('"dimensionX.1.inputRangeEndValue"');
        expect(result[0][10]).toBe('"dimensionX.1.measurementPosition"');
        expect(result[0][11]).toBe('"dimensionX.1.measurementComment.en"');
        expect(result[0][12]).toBe('"dimensionX.1.measurementComment.de"');
        expect(result[0][13]).toBe('"dimensionX.1.inputUnit"');
        expect(result[0][14]).toBe('"dimensionX.1.isImprecise"');
        expect(result[0][15]).toBe('"custom"');

        expect(result[1][1]).toBe('"100"');
        expect(result[1][4]).toBe('"Comment 1"');
        expect(result[1][5]).toBe('"Kommentar 1"');
        expect(result[1][8]).toBe('"200"');
        expect(result[1][10]).toBe('"def"');
        expect(result[1][11]).toBe('"Comment 2"');
        expect(result[1][12]).toBe('""');

        expect(result[2][1]).toBe('"300"');
        expect(result[2][2]).toBe('"ghc"');
        expect(result[2][4]).toBe('""');
        expect(result[2][5]).toBe('""');
        expect(result[2][11]).toBe('""');
        expect(result[2][12]).toBe('""');
        expect(result[2][15]).toBe('"custom"');

        expect(result[3][1]).toBe('""');
        expect(result[3][4]).toBe('""');
        expect(result[3][5]).toBe('""');
        expect(result[3][11]).toBe('""');
        expect(result[3][12]).toBe('""');
    });


    it('expand one dimension field even if no values present', () => {

        const t = makeFieldDefinitions(['identifier', 'dimensionX']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
        ];

        const result = CSVExport.createExportable(resources, t, [], ['en']).csvData.map(row => row.split(','));

        expect(result[0][1]).toBe('"dimensionX.0.inputValue"');
        expect(result[0][2]).toBe('"dimensionX.0.inputRangeEndValue"');
        expect(result[0][3]).toBe('"dimensionX.0.measurementPosition"');
        expect(result[0][4]).toBe('"dimensionX.0.measurementComment.en"');
        expect(result[0][5]).toBe('"dimensionX.0.inputUnit"');
        expect(result[0][6]).toBe('"dimensionX.0.isImprecise"');

        expect(result[1][1]).toBe('""');
    });


    it('expand one dimension field even if no values present, in header only mode', () => {

        const t = makeFieldDefinitions(['identifier', 'dimensionX']);

        const result = CSVExport.createExportable([], t, [], ['en']).csvData.map(row => row.split(','));

        expect(result[0][1]).toBe('"dimensionX.0.inputValue"');
        expect(result[0][2]).toBe('"dimensionX.0.inputRangeEndValue"');
        expect(result[0][3]).toBe('"dimensionX.0.measurementPosition"');
        expect(result[0][4]).toBe('"dimensionX.0.measurementComment.en"');
        expect(result[0][5]).toBe('"dimensionX.0.inputUnit"');
        expect(result[0][6]).toBe('"dimensionX.0.isImprecise"');
    });


    it('expand multiple dimension fields', () => {

        const t = makeFieldDefinitions(['identifier', 'dimensionX', 'dimensionY']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
            ifResource('i2', 'identifier2', { en: 'shortDescription2' }, 'category'),
        ];
        resources[0]['dimensionX'] = [{ inputValue: 100, inputUnit: 'cm',
            measurementComment: { en: 'A1', de: 'A2' } }];
        resources[1]['dimensionY'] = [{ inputValue: 300, inputUnit: 'cm', inputRangeEndValue: 'ghc',
            measurementComment: 'B' }];

        const result = CSVExport.createExportable(resources, t, [], ['en']).csvData.map(row => row.split(','));

        expect(result[0][1]).toBe('"dimensionX.0.inputValue"');
        expect(result[0][2]).toBe('"dimensionX.0.inputRangeEndValue"');
        expect(result[0][3]).toBe('"dimensionX.0.measurementPosition"');
        expect(result[0][4]).toBe('"dimensionX.0.measurementComment.en"');
        expect(result[0][5]).toBe('"dimensionX.0.measurementComment.de"');
        expect(result[0][6]).toBe('"dimensionX.0.inputUnit"');
        expect(result[0][7]).toBe('"dimensionX.0.isImprecise"');
        expect(result[0][8]).toBe('"dimensionY.0.inputValue"');
        expect(result[0][9]).toBe('"dimensionY.0.inputRangeEndValue"');
        expect(result[0][10]).toBe('"dimensionY.0.measurementPosition"');
        expect(result[0][11]).toBe('"dimensionY.0.measurementComment.en"');
        expect(result[0][12]).toBe('"dimensionY.0.measurementComment.unspecifiedLanguage"');
        expect(result[0][13]).toBe('"dimensionY.0.inputUnit"');
        expect(result[0][14]).toBe('"dimensionY.0.isImprecise"');

        expect(result[1][1]).toBe('"100"');
        expect(result[1][4]).toBe('"A1"');
        expect(result[1][5]).toBe('"A2"');
        expect(result[2][8]).toBe('"300"');
        expect(result[2][9]).toBe('"ghc"');
        expect(result[2][11]).toBe('""');
        expect(result[2][12]).toBe('"B"');
    });


    it('expand literature', () => {

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

        const result = CSVExport.createExportable(resources, t, [], ['en']).csvData.map(row => row.split(','));

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


    it('expand composite fields', () => {

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

        const result = CSVExport.createExportable(resources, fieldDefinitions, [], ['de', 'en'])
            .csvData.map(row => row.split(','));

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


    it('expand one composite field even if no values present', () => {

        const fieldDefinitions: Array<Field> = makeFieldDefinitions(['identifier', 'composite']);
        fieldDefinitions[1].subfields = [
            { name: 'subfield1', inputType: 'int' },
            { name: 'subfield2', inputType: 'input' }
        ]

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
        ];

        const result = CSVExport.createExportable(resources, fieldDefinitions, [], ['en'])
            .csvData.map(row => row.split(','));

        expect(result[0][1]).toBe('"composite.0.subfield1"');
        expect(result[0][2]).toBe('"composite.0.subfield2.en"');

        expect(result[1][1]).toBe('""');
    });


    it('expand one composite field even if no values present, in header only mode', () => {

        const fieldDefinitions: Array<Field> = makeFieldDefinitions(['identifier', 'composite']);
        fieldDefinitions[1].subfields = [
            { name: 'subfield1', inputType: 'int' },
            { name: 'subfield2', inputType: 'input' }
        ]

        const result = CSVExport.createExportable([], fieldDefinitions, [], ['en'])
            .csvData.map(row => row.split(','));

        expect(result[0][1]).toBe('"composite.0.subfield1"');
        expect(result[0][2]).toBe('"composite.0.subfield2.en"');
    });


    it('expand i18n strings', () => {

        const t = makeFieldDefinitions(['identifier', 'input1', 'input2', 'input3']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
            ifResource('i2', 'identifier2', { en: 'shortDescription2' }, 'category')
        ];
        resources[0].input1 = { de: 'A', en: 'B' };
        resources[0].input2 = { de: 'C' };
        resources[1].input1 = { it: 'D' };
        resources[1].input2 = 'E';

        const result = CSVExport.createExportable(resources, t, [], ['de', 'en']).csvData.map(row => row.split(','));

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


    it('expand i18n string arrays', () => {

        const t = makeFieldDefinitions(['identifier', 'multiInput1', 'multiInput2']);

        const resources = [
            ifResource('i1', 'identifier1', { en: 'shortDescription1' }, 'category'),
            ifResource('i2', 'identifier2', { en: 'shortDescription2' }, 'category'),
        ];
        resources[0].multiInput1 = [{ de: 'A', en: 'B' }, { de: 'C', en: 'D' }];
        resources[0].multiInput2 = [{ de: 'E', en: 'F' }];
        resources[1].multiInput1 = [{ it: 'G' }, { de: 'H', en: 'I' }, { de: 'J' }];
        resources[1].multiInput2 = ['K'];

        const result = CSVExport.createExportable(resources, t, [], ['de', 'en']).csvData.map(row => row.split(','));

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


    it('do not add language suffixes for projects without configured project languages', () => {

        const t = makeFieldDefinitions(['identifier', 'input', 'multiInput']);

        const resources = [
            ifResource('i1', 'identifier1', undefined, 'category')
        ];
        resources[0].input = 'A';
        resources[0].multiInput = ['B', 'C'];

        const result = CSVExport.createExportable(resources, t, [], []).csvData.map(row => row.split(','));

        expect(result[0].length).toBe(4);
        expect(result[0][1]).toBe('"input"');
        expect(result[0][2]).toBe('"multiInput.0"');
        expect(result[0][3]).toBe('"multiInput.1"');

        expect(result[1].length).toBe(4);
        expect(result[1][1]).toBe('"A"');
        expect(result[1][2]).toBe('"B"');
        expect(result[1][3]).toBe('"C"');
    });


    it('expand one i18n field even if no project languages are configured, in header only mode', () => {

        const t = makeFieldDefinitions(['identifier', 'input']);
        const result = CSVExport.createExportable([], t, [], []).csvData.map(row => row.split(','));

        expect(result[0][1]).toBe('"input"');
    });


    it('export scan code', () => {

        const { t, resource } = makeSimpleCategoryAndResource();
        resource.scanCode = '1234567';
        const result = CSVExport.createExportable([resource], t, [], ['en'], true, true).csvData;
        expect(result[0]).toEqual('"identifier","shortDescription.en","scanCode"');
        expect(result[1]).toEqual('"identifier1","shortDescription1","1234567"');
    });
});
