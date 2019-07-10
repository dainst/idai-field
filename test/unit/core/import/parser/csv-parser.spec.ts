import {IdaiType} from 'idai-components-2';
import {CsvParser} from '../../../../../app/core/import/parser/csv-parser';
import {makeType} from '../../export/csv-export.spec';
import {ParserErrors} from '../../../../../app/core/import/parser/parser-errors';

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


    it('field type unsignedInt - not a number', async done => { // TODO write test for negative number too

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'ui',
                inputType: 'unsignedInt'
            }],
        } as IdaiType;

        expectNotANumberError(type, 'ui\nabc', 'abc', 'ui', done);
    });


    it('field type unsignedFloat - not a number', async done => { // TODO write test for neg nmbr too

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'uf',
                inputType: 'unsignedFloat'
            }],
        } as IdaiType;

        expectNotANumberError(type, 'uf\na100.0', 'a100.0', 'uf', done);
    });


    async function expectNotANumberError(type: IdaiType, content: string, value: string, path: string, done: Function) {

        const parse = CsvParser.getParse(type, '');
        try {
            await parse(content);
            fail();
        } catch (msgWithParams) {

            expect(msgWithParams).toEqual([ParserErrors.CSV_NOT_A_NUMBER, value, path]);

        } finally {

            done();
        }
    }
});