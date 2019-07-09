import {IdaiType} from 'idai-components-2';
import {CsvParser} from '../../../../../app/core/import/parser/csv-parser';

/**
 * @author Daniel de Oliveira
 */

describe('CsvParser', () => {


    // TODO remove redundancy with CSVExport test
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


    it('basics', async done => {

        const t = makeType(['custom1, custom2']);

        const parse = CsvParser.getParse(t, 'opId1');
        const docs = await parse('custom1,custom2\n1,2');

        expect(docs[0].resource['type']).toBe('Feature');
        expect(docs[0].resource['custom1']).toBe('1');
        expect(docs[0].resource['custom2']).toBe('2');
        // TODO test liesWithin
        done();
    });
});