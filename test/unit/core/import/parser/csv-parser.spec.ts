import {IdaiType, Dating, Dimension} from 'idai-components-2';
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


    it('field type checkboxes', async done => { // TODO make sure export works for checkboxes

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'CB',
                inputType: 'checkboxes'
            }],
        } as IdaiType;

        const parse = CsvParser.getParse(type, '');
        const docs = await parse(
            'CB\n'
            + 'a;b;c');

        const cb = docs[0].resource['CB'];
        expect(cb).toEqual(['a', 'b', 'c']);
        done();
    });


    it('field type dropdown range', async done => { // TODO test import and export manually once

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'dd1',
                inputType: 'dropdownRange'
            },
                {
                    name: 'dd2',
                    inputType: 'dropdownRange'
                }],
        } as IdaiType;

        const parse = CsvParser.getParse(type, '');
        const docs = await parse(
            'dd1,dd2,dd2End\n'
            + 'a,b,c');

        expect(docs[0].resource['dd1']).toBe('a');
        expect(docs[0].resource['dd2']).toBe('b');
        expect(docs[0].resource['dd2End']).toBe('c');
        done();
    });


    it('field type date', async done => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'd',
                inputType: 'date'
            }],
        } as IdaiType;

        const parse = CsvParser.getParse(type, '');
        const docs = await parse(
            'd\n'
            + '10.07.2019');

        // TODO validate date format
        expect(docs[0].resource['d']).toBe('10.07.2019'); // currently leave it as is
        done();
    });


    it('field type radio', async done => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'r',
                inputType: 'radio'
            }],
        } as IdaiType;

        const parse = CsvParser.getParse(type, '');
        const docs = await parse(
            'r\n'
            + 'rr');

        expect(docs[0].resource['r']).toBe('rr'); // currently leave it as is
        done();
    });


    it('field type unsignedInt', async done => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'ui',
                inputType: 'unsignedInt'
            }],
        } as IdaiType;

        const parse = CsvParser.getParse(type, '');
        const docs = await parse(
            'ui\n'
            + '100');

        expect(docs[0].resource['ui']).toBe(100);
        done();
    });


    it('field type unsignedFloat', async done => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'uf',
                inputType: 'unsignedFloat'
            }],
        } as IdaiType;

        const parse = CsvParser.getParse(type, '');
        const docs = await parse(
            'uf\n'
            + '100.0');

        expect(docs[0].resource['uf']).toBe(100.0);
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