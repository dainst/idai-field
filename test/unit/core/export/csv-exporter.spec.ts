import {IdaiType} from 'idai-components-2';
import {CSVExporter} from '../../../../app/core/export/csv-exporter';
import {Static} from '../../static';


/**
 * @author Daniel de Oliveira
 */
describe('CSVExporter', () => {



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
                }
            ]
        });

        const result = CSVExporter.createExportable([], t);
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
        const result = CSVExporter.createExportable(docs, t);
        expect(result[0]).toEqual(['identifier1', 'shortDescription1']);
    });
});