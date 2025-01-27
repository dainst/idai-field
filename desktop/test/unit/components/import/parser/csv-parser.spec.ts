import { CategoryForm } from 'idai-field-core';
import { CsvParser } from '../../../../../src/app/components/import/parser/csv-parser';
import { makeFieldDefinitions } from '../../export/csv/csv-export.spec';
import { ParserErrors } from '../../../../../src/app/components/import/parser/parser-errors';


/**
 * @author Daniel de Oliveira
 */
describe('CsvParser', () => {

    test('basics', async () => {

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
    });


    test('no lies within', async () => {

        const category = makeFieldDefinitions(['custom1, custom2']);

        const parse = CsvParser.build({
            name: 'Feature', groups: [{ fields: category }] } as CategoryForm,
            '',
            ','
        );
        const docs = await parse('custom1,custom2\n1,2');

        expect(docs[0].resource.relations).toEqual({});
    });


    test('take existing isChildOf', async () => {

        const category = makeFieldDefinitions([]);

        const parse = CsvParser.build({
            name: 'Feature', groups: [{ fields: category }] } as CategoryForm,
            '',
            ','
        );
        const docs = await parse('relations.isChildOf\nopId1');

        expect(docs[0].resource.relations['isChildOf']).toBe('opId1');
    });


    test('take existing isChildOf, which overrides set isChildOf', async () => {

        const category = makeFieldDefinitions([]);

        const parse = CsvParser.build(
            { name: 'Feature', groups: [{ fields: category }] } as CategoryForm,
            'opId1',
            ','
        );
        const docs = await parse('relations.isChildOf\nfeatureId1');

        expect(docs[0].resource.relations['isChildOf']).toBe('featureId1');
    });


    test('error during field type conversion', async () => {

        const category = {
            name: 'Category',
            groups: [{
                fields: [{
                    name: 'uf',
                    inputType: 'unsignedFloat'
                }]
            }]
        } as CategoryForm;

        const parse = CsvParser.build(
            category,
            '',
            ','
        );

        try {
            await parse('uf\na100.0');
            throw new Error('Test failure');
        } catch (msgWithParams) {
            expect(msgWithParams).toEqual([ParserErrors.CSV_NOT_A_NUMBER, 'a100.0', 'uf']);
        }
    });


    test('erroneous array', async () => {

        const category = {
            name: 'Category',
            groups: [{
                fields: [{
                    name: 'dim',
                    inputType: 'dimension'
                }]
            }]
        } as CategoryForm;

        const parse = CsvParser.build(
            category,
            '',
            ','
        );

        try {
            await parse('dim.0,dim.0.a\n,');
            throw new Error('Test failure');
        } catch (msgWithParams) {
            expect(msgWithParams).toEqual([ParserErrors.CSV_INVALID_HEADING, 'dim.0']);
        }
    });
});
