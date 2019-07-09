import {IdaiType} from 'idai-components-2';
import {CsvParser} from '../../../../../app/core/import/parser/csv-parser';
import {makeType} from '../../export/csv-export.spec';

/**
 * @author Daniel de Oliveira
 */

describe('CsvParser', () => {


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