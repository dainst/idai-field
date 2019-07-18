import {IdaiType} from 'idai-components-2';
import {CSVExport} from '../../../../app/core/export/csv-export';
import {Static} from '../../static';


export function makeType(fieldNames: string[]) {


    return new IdaiType({
        type: 'Feature',
        fields: fieldNames.map(fieldName => {

            let inputType = 'input';
            if (fieldName.startsWith('dimension')) inputType = 'dimension';
            if (fieldName.startsWith('period')) inputType = 'dropdownRange';

            return { name: fieldName, inputType: inputType }
        })
    })
}


/**
 * @author Daniel de Oliveira
 */

describe('CSVExport', () => {

    function ifResource(id: string, identifier: string, sd: string, type: string) {

        return Static.ifDoc(sd, identifier, type, id).resource;
    }


    function makeSimpleTypeAndResource() {

        const t = makeType(['identifier', 'shortDescription']);
        const resource = ifResource('i1', 'identifier1', 'shortDescription1', 'type');
        return {t: t, resource: resource};
    }


    it('create header line if documents empty', () => {

        const t = makeType(['identifier', 'shortDescription', 'custom', 'id']);

        const result = CSVExport.createExportable([], t, []);
        expect(result[0]).toBe('"identifier","shortDescription","custom","relations.isChildOf"');
    });


    it('create document line', () => {

        const {t, resource} = makeSimpleTypeAndResource();
        const result = CSVExport.createExportable([resource], t, []);
        expect(result[0]).toEqual('"identifier","shortDescription","relations.isChildOf"');
        expect(result[1]).toEqual('"identifier1","shortDescription1",""');
    });


    it('export relations', () => {

        const {t, resource} = makeSimpleTypeAndResource();
        resource.relations = { someRelation: ["identifier2"] } as any;

        const result = CSVExport.createExportable([resource], t, ['someRelation']);
        expect(result[0]).toBe('"identifier","shortDescription","relations.someRelation","relations.isChildOf"');
        expect(result[1]).toBe('"identifier1","shortDescription1","identifier2",""');
    });


    function expectCorrectChildOfTarget(resource, t, expectation) {

        const result = CSVExport.createExportable([resource], t, ['isRecordedIn', 'liesWithin', 'includes']);
        expect(result[0]).toBe('"identifier","shortDescription","relations.isChildOf"');
        expect(result[1]).toBe('"identifier1","shortDescription1",' + expectation);
    }


    it('handle double quotes in field values', () => {

        const {t, resource} = makeSimpleTypeAndResource();
        resource.shortDescription = 'ABC " "DEF"';
        const result = CSVExport.createExportable([resource], t, []);
        expect(result[0]).toEqual('"identifier","shortDescription","relations.isChildOf"');
        expect(result[1]).toEqual('"identifier1","ABC "" ""DEF""",""');
    });


    it('export array fields', () => {

        const t = makeType(['identifier', 'shortDescription', 'color']);
        const resource = ifResource('i1', 'identifier1', 'shortDescription1', 'type');
        resource.color = ['blue', 'red', 'yellow'];
        const result = CSVExport.createExportable([resource], t, []);
        expect(result[0]).toEqual('"identifier","shortDescription","color","relations.isChildOf"');
        expect(result[1]).toEqual('"identifier1","shortDescription1","blue;red;yellow",""');
    });


    it('is nested in another resource', () => {

        const {t, resource} = makeSimpleTypeAndResource();
        resource.relations = {
            liesWithin: ['identifier2'],
            isRecordedIn: ['operation1']
        } as any;
        expectCorrectChildOfTarget(resource, t, '"identifier2"');
    });


    it('is nested in an operation', () => {

        const {t, resource} = makeSimpleTypeAndResource();
        resource.relations = {
            isRecordedIn: ['operation1']
        } as any;
        expectCorrectChildOfTarget(resource, t, '"operation1"')
    });


    it('expand dropdownRange', () => {

        const t = makeType(['identifier', 'period', 'custom']);

        const resources = [
            ifResource('i1', 'identifier1', 'shortDescription1', 'type'),
            ifResource('i2', 'identifier2', 'shortDescription2', 'type'),
            ifResource('i3', 'identifier3', 'shortDescription3', 'type')
        ];

        resources[0].period = 'A';
        resources[0].periodEnd = 'B';
        resources[1].period = 'A';

        const result = CSVExport.createExportable(resources, t, []).map(row => row.split(','));

        expect(result[0][1]).toBe('"period"');
        expect(result[0][2]).toBe('"periodEnd"');
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

        const t = makeType(['identifier', 'periodA', 'periodB', 'custom']);

        const resources = [
            ifResource('i1', 'identifier1', 'shortDescription1', 'type'),
        ];

        resources[0].periodA = 'A';
        resources[0].periodAEnd = 'B';
        resources[0].periodB = 'C';
        resources[0].periodBEnd = 'D';
        resources[0].custom = 'custom';

        const result = CSVExport.createExportable(resources, t, []).map(row => row.split(','));

        expect(result[0][1]).toBe('"periodA"');
        expect(result[0][2]).toBe('"periodAEnd"');
        expect(result[0][3]).toBe('"periodB"');
        expect(result[0][4]).toBe('"periodBEnd"');
        expect(result[0][5]).toBe('"custom"');

        expect(result[1][1]).toBe('"A"');
        expect(result[1][2]).toBe('"B"');
        expect(result[1][3]).toBe('"C"');
        expect(result[1][4]).toBe('"D"');
        expect(result[1][5]).toBe('"custom"');
    });


    it('expand dating', () => {

        const t = makeType(['identifier', 'dating', 'custom']);

        const resources = [
            ifResource('i1', 'identifier1', 'shortDescription1', 'type'),
            ifResource('i2', 'identifier2', 'shortDescription2', 'type'),
            ifResource('i3', 'identifier3', 'shortDescription3', 'type')
        ];
        resources[0].dating = [
            {begin: {inputYear: 10}, end: {inputYear: 20}, source: 'some1'},
            {begin: {inputYear: 20}, end: {inputYear: 30}, source: 'some2'}];
        resources[1].dating = [
            {begin: {inputYear: 40}, end: {inputYear: 50}, source: 'some3'}];
        resources[1].custom = 'custom';

        const result = CSVExport.createExportable(resources, t, []).map(row => row.split(','));

        expect(result[0][1]).toBe('"dating.0.type"');
        expect(result[0][2]).toBe('"dating.0.begin.inputType"');
        expect(result[0][3]).toBe('"dating.0.begin.inputYear"');
        expect(result[0][4]).toBe('"dating.0.end.inputType"');
        expect(result[0][5]).toBe('"dating.0.end.inputYear"');
        expect(result[0][6]).toBe('"dating.0.margin"');
        expect(result[0][7]).toBe('"dating.0.source"');
        expect(result[0][8]).toBe('"dating.0.isImprecise"');
        expect(result[0][9]).toBe('"dating.0.isUncertain"');
        expect(result[0][10]).toBe('"dating.1.type"');
        expect(result[0][11]).toBe('"dating.1.begin.inputType"');
        expect(result[0][12]).toBe('"dating.1.begin.inputYear"');
        expect(result[0][13]).toBe('"dating.1.end.inputType"');
        expect(result[0][14]).toBe('"dating.1.end.inputYear"');
        expect(result[0][15]).toBe('"dating.1.margin"');
        expect(result[0][16]).toBe('"dating.1.source"');
        expect(result[0][17]).toBe('"dating.1.isImprecise"');
        expect(result[0][18]).toBe('"dating.1.isUncertain"');
        expect(result[0][19]).toBe('"custom"');

        expect(result[1][3]).toBe('"10"');
        expect(result[1][5]).toBe('"20"');
        expect(result[1][7]).toBe('"some1"');
        expect(result[1][12]).toBe('"20"');
        expect(result[1][14]).toBe('"30"');
        expect(result[1][16]).toBe('"some2"');
        expect(result[1][19]).toBe('""');

        expect(result[2][3]).toBe('"40"');
        expect(result[2][5]).toBe('"50"');
        expect(result[2][7]).toBe('"some3"');
        expect(result[2][12]).toBe('""');
        expect(result[2][14]).toBe('""');
        expect(result[2][16]).toBe('""');
        expect(result[2][19]).toBe('"custom"');

        expect(result[3][3]).toBe('""');
        expect(result[3][5]).toBe('""');
        expect(result[3][7]).toBe('""');
        expect(result[3][12]).toBe('""');
        expect(result[3][14]).toBe('""');
        expect(result[3][16]).toBe('""');
        expect(result[3][19]).toBe('""');
    });


    it('expand dating field even if no value present', () => {

        const t = makeType(['identifier', 'dating']);

        const resources = [
            ifResource('i1', 'identifier1', 'shortDescription1', 'type'),
        ];

        const result = CSVExport.createExportable(resources, t, []).map(row => row.split(','));

        expect(result[0][1]).toBe('"dating.0.type"');
        expect(result[0][2]).toBe('"dating.0.begin.inputType"');
        expect(result[0][3]).toBe('"dating.0.begin.inputYear"');
        expect(result[0][4]).toBe('"dating.0.end.inputType"');
        expect(result[0][5]).toBe('"dating.0.end.inputYear"');
        expect(result[0][6]).toBe('"dating.0.margin"');
        expect(result[0][7]).toBe('"dating.0.source"');
        expect(result[0][8]).toBe('"dating.0.isImprecise"');
        expect(result[0][9]).toBe('"dating.0.isUncertain"');

        expect(result[1][1]).toBe('""');
    });


    it('expand dating field even if no value present, in header only mode', () => {

        const t = makeType(['identifier', 'dating']);

        const result = CSVExport.createExportable([], t, []).map(row => row.split(','));

        expect(result[0][1]).toBe('"dating.0.type"');
        expect(result[0][2]).toBe('"dating.0.begin.inputType"');
        expect(result[0][3]).toBe('"dating.0.begin.inputYear"');
        expect(result[0][4]).toBe('"dating.0.end.inputType"');
        expect(result[0][5]).toBe('"dating.0.end.inputYear"');
        expect(result[0][6]).toBe('"dating.0.margin"');
        expect(result[0][7]).toBe('"dating.0.source"');
        expect(result[0][8]).toBe('"dating.0.isImprecise"');
        expect(result[0][9]).toBe('"dating.0.isUncertain"');
    });


    it('do not modify resource when expanding', () => {

        const {t, resource} = makeSimpleTypeAndResource();
        resource.dating = [{begin: {year: 10}, end: {year: 20}, source: 'some1', label: 'blablabla1'}];

        CSVExport.createExportable([resource], t, []).map(row => row.split(','));

        expect(resource['dating'][0]['begin']['year']).toBe(10);
        expect(resource['dating'][0]['end']['year']).toBe(20);
        expect(resource['dating'][0]['source']).toBe('some1');
    });


    it('do not modify resource when expanding relations', () => {

        const {t, resource} = makeSimpleTypeAndResource();
        resource['relations']['isAbove'] = ['abc'];

        CSVExport.createExportable([resource], t, ['isAbove']).map(row => row.split(','));

        expect(resource['relations']['isAbove'][0]).toBe('abc');
    });


    it('expand dimension', () => {

        const t = makeType(['identifier', 'dimensionX', 'custom']);

        const resources = [
            ifResource('i1', 'identifier1', 'shortDescription1', 'type'),
            ifResource('i2', 'identifier2', 'shortDescription2', 'type'),
            ifResource('i3', 'identifier3', 'shortDescription3', 'type'),
        ];
        resources[0]['dimensionX'] = [
            {inputValue: 100, measurementComment: 'abc'},
            {inputValue: 200, measurementPosition: 'def'}];
        resources[1]['dimensionX'] = [
            {inputValue: 300, inputRangeEndValue: 'ghc'}];
        resources[1]['custom'] = 'custom';

        const result = CSVExport.createExportable(resources, t, []).map(row => row.split(','));

        expect(result[0][1]).toBe('"dimensionX.0.inputValue"');
        expect(result[0][2]).toBe('"dimensionX.0.inputRangeEndValue"');
        expect(result[0][3]).toBe('"dimensionX.0.measurementPosition"');
        expect(result[0][4]).toBe('"dimensionX.0.measurementComment"');
        expect(result[0][5]).toBe('"dimensionX.0.inputUnit"');
        expect(result[0][6]).toBe('"dimensionX.0.isImprecise"');
        expect(result[0][7]).toBe('"dimensionX.0.isRange"');
        expect(result[0][8]).toBe('"dimensionX.1.inputValue"');
        expect(result[0][9]).toBe('"dimensionX.1.inputRangeEndValue"');
        expect(result[0][10]).toBe('"dimensionX.1.measurementPosition"');
        expect(result[0][11]).toBe('"dimensionX.1.measurementComment"');
        expect(result[0][12]).toBe('"dimensionX.1.inputUnit"');
        expect(result[0][13]).toBe('"dimensionX.1.isImprecise"');
        expect(result[0][14]).toBe('"dimensionX.1.isRange"');

        expect(result[1][1]).toBe('"100"');
        expect(result[1][4]).toBe('"abc"');
        expect(result[1][8]).toBe('"200"');
        expect(result[1][10]).toBe('"def"');

        expect(result[2][1]).toBe('"300"');
        expect(result[2][2]).toBe('"ghc"');
        expect(result[2][15]).toBe('"custom"');

        expect(result[3][1]).toBe('""');
    });


    it('expand one dimension field even if no values present', () => {

        const t = makeType(['identifier', 'dimensionX']);

        const resources = [
            ifResource('i1', 'identifier1', 'shortDescription1', 'type'),
        ];

        const result = CSVExport.createExportable(resources, t, []).map(row => row.split(','));

        expect(result[0][1]).toBe('"dimensionX.0.inputValue"');
        expect(result[0][2]).toBe('"dimensionX.0.inputRangeEndValue"');
        expect(result[0][3]).toBe('"dimensionX.0.measurementPosition"');
        expect(result[0][4]).toBe('"dimensionX.0.measurementComment"');
        expect(result[0][5]).toBe('"dimensionX.0.inputUnit"');
        expect(result[0][6]).toBe('"dimensionX.0.isImprecise"');
        expect(result[0][7]).toBe('"dimensionX.0.isRange"');

        expect(result[1][1]).toBe('""');
    });


    it('expand one dimension field even if no values present, in header only mode', () => {

        const t = makeType(['identifier', 'dimensionX']);

        const result = CSVExport.createExportable([], t, []).map(row => row.split(','));

        expect(result[0][1]).toBe('"dimensionX.0.inputValue"');
        expect(result[0][2]).toBe('"dimensionX.0.inputRangeEndValue"');
        expect(result[0][3]).toBe('"dimensionX.0.measurementPosition"');
        expect(result[0][4]).toBe('"dimensionX.0.measurementComment"');
        expect(result[0][5]).toBe('"dimensionX.0.inputUnit"');
        expect(result[0][6]).toBe('"dimensionX.0.isImprecise"');
        expect(result[0][7]).toBe('"dimensionX.0.isRange"');
    });


    it('expand multiple dimension fields', () => {

        const t = makeType(['identifier', 'dimensionX', 'dimensionY']);

        const resources = [
            ifResource('i1', 'identifier1', 'shortDescription1', 'type'),
            ifResource('i2', 'identifier2', 'shortDescription2', 'type'),
        ];
        resources[0]['dimensionX'] = [{inputValue: 100, measurementComment: 'abc'}];
        resources[1]['dimensionY'] = [{inputValue: 300, inputRangeEndValue: 'ghc'}];

        const result = CSVExport.createExportable(resources, t, []).map(row => row.split(','));

        expect(result[0][1]).toBe('"dimensionX.0.inputValue"');
        expect(result[0][2]).toBe('"dimensionX.0.inputRangeEndValue"');
        expect(result[0][3]).toBe('"dimensionX.0.measurementPosition"');
        expect(result[0][4]).toBe('"dimensionX.0.measurementComment"');
        expect(result[0][5]).toBe('"dimensionX.0.inputUnit"');
        expect(result[0][6]).toBe('"dimensionX.0.isImprecise"');
        expect(result[0][7]).toBe('"dimensionX.0.isRange"');
        expect(result[0][8]).toBe('"dimensionY.0.inputValue"');
        expect(result[0][9]).toBe('"dimensionY.0.inputRangeEndValue"');
        expect(result[0][10]).toBe('"dimensionY.0.measurementPosition"');
        expect(result[0][11]).toBe('"dimensionY.0.measurementComment"');
        expect(result[0][12]).toBe('"dimensionY.0.inputUnit"');
        expect(result[0][13]).toBe('"dimensionY.0.isImprecise"');
        expect(result[0][14]).toBe('"dimensionY.0.isRange"');

        expect(result[1][1]).toBe('"100"');
        expect(result[1][4]).toBe('"abc"');
        expect(result[2][8]).toBe('"300"');
        expect(result[2][9]).toBe('"ghc"');
    });
});