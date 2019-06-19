import {IdaiType} from 'idai-components-2';
import {CSVExport} from '../../../../app/core/export/csv-export';
import {Static} from '../../static';


/**
 * @author Daniel de Oliveira
 */

describe('CSVExport', () => {



    it('create header line', () => {

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
        docs[0].resource.dating = ['a', 'b'];
        docs[1].resource.dating = ['a'];

        const result = CSVExport.createExportable(docs, t);

        expect(result[0].split(',')[1]).toBe('dating.0');
        expect(result[0].split(',')[2]).toBe('dating.1');
        expect(result[0].split(',')[3]).toBe('custom');

        expect(result[1].split(',')[1]).toBe('a');
        expect(result[1].split(',')[2]).toBe('b');

        expect(result[2].split(',')[1]).toBe('a');
        expect(result[2].split(',')[2]).toBe('');

        expect(result[3].split(',')[1]).toBe('');
        expect(result[3].split(',')[2]).toBe('');
    });
});