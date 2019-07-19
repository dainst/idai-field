import {CsvRowsConversion} from '../../../../../app/core/import/parser/csv-rows-conversion';
import {CsvParser} from '../../../../../app/core/import/parser/csv-parser';
import SEPARATOR = CsvParser.SEPARATOR;

/**
 * @author Daniel de Oliveira
 */
describe('CsvRowsConversion', () => {

    it('three fields', () => {

        const struct = CsvRowsConversion.parse(SEPARATOR)(
            'identifier,shortDescription,custom\n' +
            '10,zehn,bla');

        expect(struct.length).toBe(1);
        expect(struct[0]['identifier']).toBe('10');
        expect(struct[0]['shortDescription']).toBe('zehn');
        expect(struct[0]['custom']).toBe('bla');
    });


    it('two lines', () => {

        const structs = CsvRowsConversion.parse(SEPARATOR)(
            'a\n' +
            '10\n' +
            '11');

        expect(structs.length).toBe(2);
        expect(structs[0]['a']).toBe('10');
        expect(structs[1]['a']).toBe('11');
    });


    it('parse lines with quotes', () => {

        const structs = CsvRowsConversion.parse(SEPARATOR)(
            'field1,field2,field3,field4,field5,field6\n' +
            '"Value","ValueX,ValueY,ValueZ","Value: ""XYZ""","""XYZ""","W,""X,Y"",Z",""');

        expect(structs.length).toBe(1);
        expect(structs[0]['field1']).toBe('Value');
        expect(structs[0]['field2']).toBe('ValueX,ValueY,ValueZ');
        expect(structs[0]['field3']).toBe('Value: "XYZ"');
        expect(structs[0]['field4']).toBe('"XYZ"');
        expect(structs[0]['field5']).toBe('W,"X,Y",Z');
        expect(structs[0]['field6']).toBe(undefined);
    });


    it('implode struct', () => {

        const content =
            'a.b\n' +
            '100';

        const structs = CsvRowsConversion.parse(SEPARATOR)(content);
        const struct = structs[0];
        expect(struct['a']['b']).toBe('100');
    });


    it('implode array with nested structure', () => {

        const content =
            'identifier,array.0.begin.year,array.0.end.year,array.0.source,array.0.label\n' +
            'identifier1,100,200,S,L';

        const structs = CsvRowsConversion.parse(SEPARATOR)(content);
        expect(structs.length).toBe(1);

        const struct = structs[0];
        expect(struct['identifier']).toBe('identifier1');
        expect(struct['array'][0].begin.year).toBe('100');
        expect(struct['array'][0].end.year).toBe('200');
        expect(struct['array'][0].source).toBe('S');
        expect(struct['array'][0].label).toBe('L');
    });


    it('make sure arrays are dense', () => {

        const content =
            'a.1.b.c\n' +
            '10';

        const structs = CsvRowsConversion.parse(SEPARATOR)(content);
        const struct = structs[0];
        const nrEnumeratedItems = struct['a'].reduce((sum, _) => sum + 1, 0);
        expect(nrEnumeratedItems).toBe(2);
    });
});