import {IdaiType} from 'idai-components-2';
import {CSVExporter} from '../../../../app/core/export/csv-exporter';
import {Static} from '../../static';


/**
 * @author Daniel de Oliveira
 */
describe('CSVExporter', () => {

    it('basics', () => {

        const t = new IdaiType({
            type: 'Feature',
            fields: [
                {
                    name: 'one'
                }
            ]
        });

        const docs = [Static.ifDoc('sd', 'id', 'type', 'i')];
        const result = CSVExporter.createExportable(docs, t);
        expect(result[0]).toBe('one');
    });
});