import {IdaiType} from 'idai-components-2';
import {CSVExport} from '../../../../app/core/export/csv-export';
import {Static} from '../../static';


/**
 * @author Daniel de Oliveira
 */

describe('CSVExport', () => {



    it('create header line if documents empty', () => {

        const t = new IdaiType({
            type: 'Feature',
            fields: [
                {
                    name: 'identifier'
                },
                {
                    name: 'shortDescription'
                },
                {
                    name: 'custom'
                },
                {
                    name: 'id'
                }
            ]
        });

        const result = CSVExport.createExportable([], t);
        expect(result[0]).toBe('identifier,shortDescription,custom');
    });


    it('create document line', () => {

        const t = new IdaiType({
            type: 'Feature',
            fields: [
                {
                    name: 'identifier'
                },
                {
                    name: 'shortDescription'
                }
            ]
        });

        const docs = [Static.ifDoc('shortDescription1', 'identifier1', 'type', 'i')];
        const result = CSVExport.createExportable(docs, t);
        expect(result[0]).toEqual('identifier,shortDescription');
        expect(result[1]).toEqual('identifier1,shortDescription1');
    });


    it('expand dating', () => {

        const t = new IdaiType({
            type: 'Feature',
            fields: [
                {
                    name: 'identifier'
                },
                {
                    name: 'dating'
                },
                {
                    name: 'custom'
                }
            ]
        });

        const docs = [
            Static.ifDoc('shortDescription1', 'identifier1', 'type', 'i1'),
            Static.ifDoc('shortDescription2', 'identifier2', 'type', 'i2'),
            Static.ifDoc('shortDescription3', 'identifier3', 'type', 'i3')
        ];
        docs[0].resource.dating = [
            {begin: 10, end: 20, source: 'some1', label: 'blablabla1'},
            {begin: 20, end: 30, source: 'some2', label: 'blablabla2'}];
        docs[1].resource.dating = [
            {begin: 40, end: 50, source: 'some3', label: 'blablabla3'}];
        docs[1].resource.custom = 'custom';

        const result = CSVExport.createExportable(docs, t).map(row => row.split(','));


        expect(result[0][1]).toBe('dating.0.begin');
        expect(result[0][2]).toBe('dating.0.end');
        expect(result[0][3]).toBe('dating.0.source');
        expect(result[0][4]).toBe('dating.0.label');
        expect(result[0][5]).toBe('dating.1.begin');
        expect(result[0][6]).toBe('dating.1.end');
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
});