import {IdaiType} from 'idai-components-2';
import {CSVExport} from '../../../../app/core/export/csv-export';
import {Static} from '../../static';


/**
 * @author Daniel de Oliveira
 */
describe('CSVExport', () => {


    function makeType(fieldNames: string[]) {

        return new IdaiType({
            type: 'Feature',
            fields: fieldNames.map(fieldName => {
                return {
                    name: fieldName,
                    inputType: fieldName.startsWith('dimension') ? 'dimension' : 'input'
                }
            })
        })
    }


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
        expect(result[0]).toBe('identifier,shortDescription,custom,relations.isChildOf');
    });


    it('create document line', () => {

        const {t, resource} = makeSimpleTypeAndResource();
        const result = CSVExport.createExportable([resource], t, []);
        expect(result[0]).toEqual('identifier,shortDescription,relations.isChildOf');
        expect(result[1]).toEqual('identifier1,shortDescription1,');
    });


    it('export relations', () => {

        const {t, resource} = makeSimpleTypeAndResource();
        resource.relations = { someRelation: ["identifier2"] } as any;

        const result = CSVExport.createExportable([resource], t, ['someRelation']);
        expect(result[0]).toBe('identifier,shortDescription,relations.someRelation,relations.isChildOf');
        expect(result[1]).toBe('identifier1,shortDescription1,identifier2,');
    });


    function expectCorrectChildOfTarget(resource, t, expectation) {

        const result = CSVExport.createExportable([resource], t, ['isRecordedIn', 'liesWithin', 'includes']);
        expect(result[0]).toBe('identifier,shortDescription,relations.isChildOf');
        expect(result[1]).toBe('identifier1,shortDescription1,' + expectation);
    }


    it('is nested in another resource', () => {

        const {t, resource} = makeSimpleTypeAndResource();
        resource.relations = {
            liesWithin: ["identifier2"],
            isRecordedIn: ["operation1"]
        } as any;
        expectCorrectChildOfTarget(resource, t, 'identifier2');
    });


    it('is nested in an operation', () => {

        const {t, resource} = makeSimpleTypeAndResource();
        resource.relations = {
            isRecordedIn: ["operation1"]
        } as any;
        expectCorrectChildOfTarget(resource, t, 'operation1')
    });


    it('expand dating', () => {

        const t = makeType(['identifier', 'dating', 'custom']);

        const resources = [
            ifResource('i1', 'identifier1', 'shortDescription1', 'type'),
            ifResource('i2', 'identifier2', 'shortDescription2', 'type'),
            ifResource('i3', 'identifier3', 'shortDescription3', 'type')
        ];
        resources[0].dating = [
            {begin: {year: 10}, end: {year: 20}, source: 'some1', label: 'blablabla1'},
            {begin: {year: 20}, end: {year: 30}, source: 'some2', label: 'blablabla2'}];
        resources[1].dating = [
            {begin: {year: 40}, end: {year: 50}, source: 'some3', label: 'blablabla3'}];
        resources[1].custom = 'custom';

        const result = CSVExport.createExportable(resources, t, []).map(row => row.split(','));


        expect(result[0][1]).toBe('dating.0.begin.year');
        expect(result[0][2]).toBe('dating.0.end.year');
        expect(result[0][3]).toBe('dating.0.source');
        expect(result[0][4]).toBe('dating.0.label');
        expect(result[0][5]).toBe('dating.1.begin.year');
        expect(result[0][6]).toBe('dating.1.end.year');
        expect(result[0][7]).toBe('dating.1.source');
        expect(result[0][8]).toBe('dating.1.label');
        expect(result[0][9]).toBe('custom');

        expect(result[1][1]).toBe('10');
        expect(result[1][2]).toBe('20');
        expect(result[1][3]).toBe('some1');
        expect(result[1][4]).toBe('blablabla1');
        expect(result[1][5]).toBe('20');
        expect(result[1][6]).toBe('30');
        expect(result[1][7]).toBe('some2');
        expect(result[1][8]).toBe('blablabla2');
        expect(result[1][9]).toBe('');

        expect(result[2][1]).toBe('40');
        expect(result[2][2]).toBe('50');
        expect(result[2][3]).toBe('some3');
        expect(result[2][4]).toBe('blablabla3');
        expect(result[2][5]).toBe('');
        expect(result[2][6]).toBe('');
        expect(result[2][7]).toBe('');
        expect(result[2][8]).toBe('');
        expect(result[2][9]).toBe('custom');

        expect(result[3][1]).toBe('');
        expect(result[3][2]).toBe('');
        expect(result[3][3]).toBe('');
        expect(result[3][4]).toBe('');
        expect(result[3][5]).toBe('');
        expect(result[3][6]).toBe('');
        expect(result[3][7]).toBe('');
        expect(result[3][8]).toBe('');
        expect(result[3][9]).toBe('');
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
            {value: 100, measurementComment: 'abc'},
            {inputValue: 200, measurementPosition: 'def'}];
        resources[1]['dimensionX'] = [
            {value: 300, inputRangeEndValue: 'ghc'}];
        resources[1]['custom'] = 'custom';
        //
        const result = CSVExport.createExportable(resources, t, []).map(row => row.split(','));

        expect(result[0][1]).toBe('dimensionX.0.value');
        expect(result[0][2]).toBe('dimensionX.0.inputValue');
        expect(result[0][3]).toBe('dimensionX.0.inputRangeEndValue');
        expect(result[0][4]).toBe('dimensionX.0.measurementPosition');
        expect(result[0][5]).toBe('dimensionX.0.measurementComment');
        expect(result[0][6]).toBe('dimensionX.0.inputUnit');
        expect(result[0][7]).toBe('dimensionX.0.isImprecise');
        expect(result[0][8]).toBe('dimensionX.0.isRange');
        expect(result[0][9]).toBe('dimensionX.0.label');
        expect(result[0][10]).toBe('dimensionX.0.rangeMin');
        expect(result[0][11]).toBe('dimensionX.0.rangeMax');
        expect(result[0][12]).toBe('dimensionX.1.value');
        expect(result[0][13]).toBe('dimensionX.1.inputValue');
        expect(result[0][14]).toBe('dimensionX.1.inputRangeEndValue');
        expect(result[0][15]).toBe('dimensionX.1.measurementPosition');
        expect(result[0][16]).toBe('dimensionX.1.measurementComment');
        expect(result[0][17]).toBe('dimensionX.1.inputUnit');
        expect(result[0][18]).toBe('dimensionX.1.isImprecise');
        expect(result[0][19]).toBe('dimensionX.1.isRange');
        expect(result[0][20]).toBe('dimensionX.1.label');
        expect(result[0][21]).toBe('dimensionX.1.rangeMin');
        expect(result[0][22]).toBe('dimensionX.1.rangeMax');

        expect(result[1][1]).toBe('100');
        expect(result[1][5]).toBe('abc');
        expect(result[1][13]).toBe('200');
        expect(result[1][15]).toBe('def');

        expect(result[2][1]).toBe('300');
        expect(result[2][3]).toBe('ghc');
        expect(result[2][23]).toBe('custom');

        expect(result[3][1]).toBe('');
    });
});