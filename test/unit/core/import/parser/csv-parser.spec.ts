import {IdaiType} from 'idai-components-2';
import {CsvParser} from '../../../../../app/core/import/parser/csv-parser';
import {makeType} from '../../export/csv-export.spec';

/**
 * @author Daniel de Oliveira
 */

describe('CsvParser', () => {


    it('basics', async done => {

        const type = makeType(['custom1, custom2']);

        const parse = CsvParser.getParse(type, 'opId1');
        const docs = await parse('custom1,custom2\n1,2');

        expect(docs[0].resource['type']).toBe('Feature');
        expect(docs[0].resource['custom1']).toBe('1');
        expect(docs[0].resource['custom2']).toBe('2');
        expect(docs[0].resource.relations['isChildOf']).toBe('opId1');
        done();
    });


    it('no lies within', async done => {

        const type = makeType(['custom1, custom2']);

        const parse = CsvParser.getParse(type, '');
        const docs = await parse('custom1,custom2\n1,2');

        expect(docs[0].resource.relations).toBeUndefined();
        done();
    });


    it('field type boolean', async done => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'Bool1',
                inputType: 'boolean'
            }, {
                name: 'Bool2',
                inputType: 'boolean'
            }],
        } as IdaiType;

        const parse = CsvParser.getParse(type, '');
        const docs = await parse('Bool1,Bool2\ntrue,false');

        expect(docs[0].resource['Bool1']).toBe(true);
        expect(docs[0].resource['Bool2']).toBe(false);
        done();
    });
});