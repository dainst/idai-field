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
            fields: fieldNames.map(fieldName => {return {name: fieldName}})
        })
    }


    it('create header line if documents empty', () => {

        const t = makeType(['identifier', 'shortDescription', 'custom', 'id']);

        const result = CSVExport.createExportable([], t, []);
        expect(result[0]).toBe('identifier,shortDescription,custom');
    });


    it('create document line', () => {

        const t = makeType(['identifier', 'shortDescription']);

        const docs = [Static.ifDoc('shortDescription1', 'identifier1', 'type', 'i')];
        const result = CSVExport.createExportable(docs, t, []);
        expect(result[0]).toEqual('identifier,shortDescription');
        expect(result[1]).toEqual('identifier1,shortDescription1');
    });


    it('expand dating', () => {

        const t = makeType(['identifier', 'dating', 'custom']);

        const docs = [
            Static.ifDoc('shortDescription1', 'identifier1', 'type', 'i1'),
            Static.ifDoc('shortDescription2', 'identifier2', 'type', 'i2'),
            Static.ifDoc('shortDescription3', 'identifier3', 'type', 'i3')
        ];
        docs[0].resource.dating = [
            {begin: {year: 10}, end: {year: 20}, source: 'some1', label: 'blablabla1'},
            {begin: {year: 20}, end: {year: 30}, source: 'some2', label: 'blablabla2'}];
        docs[1].resource.dating = [
            {begin: {year: 40}, end: {year: 50}, source: 'some3', label: 'blablabla3'}];
        docs[1].resource.custom = 'custom';

        const result = CSVExport.createExportable(docs, t, []).map(row => row.split(','));


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


    it('export relations', () => {

        const t = makeType(['identifier', 'shortDescription']);

        const docs = [
            Static.ifDoc('shortDescription1', 'identifier1', 'type', 'i1'),
        ];
        docs[0].resource.relations = { someRelation: ["identifier2"] } as any;

        const result = CSVExport.createExportable(docs, t, ['someRelation']);
        expect(result[0]).toBe('identifier,shortDescription,relations.someRelation');
        expect(result[1]).toBe('identifier1,shortDescription1,identifier2');
    });


    it('is nested in another resource', () => {

        const t = makeType(['identifier', 'shortDescription']);

        const docs = [
            Static.ifDoc('shortDescription1', 'identifier1', 'type', 'i1'),
        ];
        docs[0].resource.relations = {
            liesWithin: ["identifier2"],
            isRecordedIn: ["operation1"]
        } as any;

        const result = CSVExport.createExportable(docs, t, ['isRecordedIn', 'liesWithin', 'includes']);
        expect(result[0]).toBe('identifier,shortDescription,relations.liesWithin');
        expect(result[1]).toBe('identifier1,shortDescription1,identifier2');
    });


    it('is nested in an operation', () => { // TODO factor out redundandcies with previous test

        const t = makeType(['identifier', 'shortDescription']);

        const docs = [
            Static.ifDoc('shortDescription1', 'identifier1', 'type', 'i1'),
        ];
        docs[0].resource.relations = {
            isRecordedIn: ["operation1"]
        } as any;

        const result = CSVExport.createExportable(docs, t, ['isRecordedIn', 'liesWithin', 'includes']);
        expect(result[0]).toBe('identifier,shortDescription,relations.liesWithin');
        expect(result[1]).toBe('identifier1,shortDescription1,operation1');
    });
});