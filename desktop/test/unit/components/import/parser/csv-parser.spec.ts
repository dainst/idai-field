import { CategoryForm } from 'idai-field-core';
import { CsvParser } from '../../../../../src/app/components/import/parser/csv-parser';
import { makeFieldDefinitions } from '../../export/csv/csv-export.spec';
import { ParserErrors } from '../../../../../src/app/components/import/parser/parser-errors';


/**
 * @author Daniel de Oliveira
 */
describe('CsvParser', () => {

    it('basics', async done => {

        const category = makeFieldDefinitions(['custom1, custom2']);

        const parse = CsvParser.build({
            name: 'Feature', groups: [{ fields: category }] } as CategoryForm,
            'opId1',
            ','
        );
        const docs = await parse('custom1,custom2\n1,2');

        expect(docs[0].resource['category']).toBe('Feature');
        expect(docs[0].resource['custom1']).toBe('1');
        expect(docs[0].resource['custom2']).toBe('2');
        expect(docs[0].resource.relations).toEqual({});
        done();
    });


    it('no lies within', async done => {

        const category = makeFieldDefinitions(['custom1, custom2']);

        const parse = CsvParser.build({
            name: 'Feature', groups: [{ fields: category }] } as CategoryForm,
            '',
            ','
        );
        const docs = await parse('custom1,custom2\n1,2');

        expect(docs[0].resource.relations).toEqual({});
        done();
    });


    it('take existing isChildOf', async done => {

        const category = makeFieldDefinitions([]);

        const parse = CsvParser.build({
            name: 'Feature', groups: [{ fields: category }] } as CategoryForm,
            '',
            ','
        );
        const docs = await parse('relations.isChildOf\nopId1');

        expect(docs[0].resource.relations['isChildOf']).toBe('opId1');
        done();
    });


    it('take existing isChildOf, which overrides set isChildOf', async done => {

        const category = makeFieldDefinitions([]);

        const parse = CsvParser.build(
            { name: 'Feature', groups: [{ fields: category }] } as CategoryForm,
            'opId1',
            ','
        );
        const docs = await parse('relations.isChildOf\nfeatureId1');

        expect(docs[0].resource.relations['isChildOf']).toBe('featureId1');
        done();
    });


    it('error during field type conversion', async done => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'uf',
                inputType: 'unsignedFloat'
            }]}],
        } as CategoryForm;

        const parse = CsvParser.build(
            category,
            '',
            ',');

        try {
            await parse('uf\na100.0');
            fail();
        } catch (msgWithParams) {
            expect(msgWithParams).toEqual([ParserErrors.CSV_NOT_A_NUMBER, 'a100.0', 'uf']);
        } finally {
            done();
        }
    });


    it('erroneous array', async done => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'dim',
                inputType: 'dimension'
            }]}],
        } as CategoryForm;

        const parse = CsvParser.build(
            category,
            '',
            ',');

        try {
            const docs = await parse('dim.0,dim.0.a\n,');
            fail();
        } catch (msgWithParams) {
            expect(msgWithParams).toEqual([ParserErrors.CSV_INVALID_HEADING, 'dim.0']);
        } finally {
            done();
        }
    });
});
