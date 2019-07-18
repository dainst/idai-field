import {IdaiType} from 'idai-components-2';
import {CsvParser} from '../../../../../app/core/import/parser/csv-parser';
import {makeFieldDefinitions} from '../../export/csv-export.spec';
import {ParserErrors} from '../../../../../app/core/import/parser/parser-errors';

/**
 * @author Daniel de Oliveira
 */

describe('CsvParser', () => {


    it('basics', async done => {

        const type = makeFieldDefinitions(['custom1, custom2']);

        const parse = CsvParser.getParse({name: 'Feature', fields:type} as IdaiType, 'opId1');
        const docs = await parse('custom1,custom2\n1,2');

        expect(docs[0].resource['type']).toBe('Feature');
        expect(docs[0].resource['custom1']).toBe('1');
        expect(docs[0].resource['custom2']).toBe('2');
        expect(docs[0].resource.relations['isChildOf']).toBe('opId1');
        done();
    });


    it('no lies within', async done => {

        const type = makeFieldDefinitions(['custom1, custom2']);

        const parse = CsvParser.getParse({name: 'Feature', fields:type} as IdaiType, '');
        const docs = await parse('custom1,custom2\n1,2');

        expect(docs[0].resource.relations).toEqual({});
        done();
    });


    it('error during field type conversion', async done => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'uf',
                inputType: 'unsignedFloat'
            }],
        } as IdaiType;

        const parse = CsvParser.getParse(type, '');
        try {
            await parse('uf\na100.0');
            fail();
        } catch (msgWithParams) {

            expect(msgWithParams).toEqual([ParserErrors.CSV_NOT_A_NUMBER, 'a100.0', 'uf']);

        } finally {

            done();
        }
    });
});