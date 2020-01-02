import {convertCsvRows} from '../../../../../app/core/import/parser/convert-csv-rows';
import {ParserErrors} from '../../../../../app/core/import/parser/parser-errors';
import CSV_INVALID_HEADING = ParserErrors.CSV_INVALID_HEADING;


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('convertCsvRows', () => {

    it('three fields', () => {

        const struct = convertCsvRows(',')(
            'identifier,shortDescription,custom\n' +
            '10,zehn,bla');

        expect(struct.length).toBe(1);
        expect(struct[0]['identifier']).toBe('10');
        expect(struct[0]['shortDescription']).toBe('zehn');
        expect(struct[0]['custom']).toBe('bla');
    });


    it('two lines', () => {

        const structs = convertCsvRows(',')(
            'a\n' +
            '10\n' +
            '11');

        expect(structs.length).toBe(2);
        expect(structs[0]['a']).toBe('10');
        expect(structs[1]['a']).toBe('11');
    });


    it('parse content with quotes', () => {

        const structs = convertCsvRows(',')(
            'field1,field2,field3,field4,field5,field6\n' +
            '"Value","ValueX,ValueY,ValueZ","Value: ""XYZ""","""XYZ""","W,""X,Y"",Z",""');

        expect(structs.length).toBe(1);
        expect(structs[0]['field1']).toBe('Value');
        expect(structs[0]['field2']).toBe('ValueX,ValueY,ValueZ');
        expect(structs[0]['field3']).toBe('Value: "XYZ"');
        expect(structs[0]['field4']).toBe('"XYZ"');
        expect(structs[0]['field5']).toBe('W,"X,Y",Z');
        expect(structs[0]['field6']).toBe(null);
    });


    it('parse linebreaks in field values', () => {

        const structs = convertCsvRows(',')(
            'field1,field2,field3\n' +
            '"Line 1\nLine 2","Line 1\rLine 2","Line 1\n\rLine 2"\r' +
            'ValueX,ValueY,ValueZ\n\r' +
            'ValueA,ValueB,ValueC');

        expect(structs.length).toBe(3);
        expect(structs[0]['field1']).toBe('Line 1\nLine 2');
        expect(structs[0]['field2']).toBe('Line 1\nLine 2');
        expect(structs[0]['field3']).toBe('Line 1\nLine 2');
        expect(structs[1]['field1']).toBe('ValueX');
        expect(structs[1]['field2']).toBe('ValueY');
        expect(structs[1]['field3']).toBe('ValueZ');
        expect(structs[2]['field1']).toBe('ValueA');
        expect(structs[2]['field2']).toBe('ValueB');
        expect(structs[2]['field3']).toBe('ValueC');
    });


    it('implode struct', () => {

        const content =
            'a.b\n' +
            '100';

        const structs = convertCsvRows(',')(content);
        const struct = structs[0];
        expect(struct['a']['b']).toBe('100');
    });


    it('implode array with nested structure', () => {

        const content =
            'identifier,array.0.begin.year,array.0.end.year,array.0.source,array.0.label\n' +
            'identifier1,100,200,S,L';

        const structs = convertCsvRows(',')(content);
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

        const structs = convertCsvRows(',')(content);
        const struct = structs[0];
        const nrEnumeratedItems = struct['a'].reduce((sum, _) => sum + 1, 0);
        expect(nrEnumeratedItems).toBe(2);
    });


    it('parse empty fields on different levels', () => {

        const struct = convertCsvRows(',')(
            'a\n' +
            '""');

        expect(struct.length).toBe(1);
        expect(struct[0]['a']).toBe(null);

        const struct1 = convertCsvRows(',')(
            'a,a.b\n' +
            '"",""');

        expect(struct1.length).toBe(1);
        expect(struct1[0]['a']['b']).toBe(null);

        const struct2 = convertCsvRows(',')(
            'a,a.b,a.b.c\n' +
            '"","",""');

        expect(struct2.length).toBe(1);
        expect(struct2[0]['a']['b']['c']).toBe(null);
    });


    it('parse last field in file even if empty', () => {

        const struct = convertCsvRows(',')(
            'a,b\n' +
            'Value,');

        expect(struct.length).toBe(1);
        expect(struct[0]['a']).toBe('Value');
        expect(struct[0]['b']).toBe(null);
    });


    it('inconsistent headings found', () => {

        try {
            convertCsvRows(',')('a.10,a.10.a');
            fail();
        } catch (expected) {
            expect(expected).toEqual([CSV_INVALID_HEADING, 'a.10']);
        }
    });


    it('can set array entry to null', () => {

        const struct = convertCsvRows(',')(
            'a.0\n' + '""');

        expect(struct.length).toBe(1);
        expect(struct[0]['a'].length).toBe(1);
        expect(struct[0]['a'][0]).toBeNull();
    });
});