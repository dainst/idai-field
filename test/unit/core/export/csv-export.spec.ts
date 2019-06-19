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
        expect(result[0]).toBe('identifier, shortDescription, custom');
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
        expect(result[0]).toEqual('identifier, shortDescription');
        expect(result[1]).toEqual('identifier1, shortDescription1');
    });
});