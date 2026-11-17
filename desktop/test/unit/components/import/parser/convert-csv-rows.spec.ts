import { convertCsvRows } from '../../../../../src/app/components/import/parser/convert-csv-rows';
import { ParserErrors } from '../../../../../src/app/components/import/parser/parser-errors';
import CSV_INVALID_HEADING = ParserErrors.CSV_INVALID_HEADING;
import CSV_HEADING_ARRAY_INDICES_INVALID_SEQUENCE = ParserErrors.CSV_HEADING_ARRAY_INDICES_INVALID_SEQUENCE;


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('convertCsvRows', () => {

    test('three fields', () => {

        const struct = convertCsvRows(',')(
            'identifier,shortDescription,custom\n' +
            '10,abc,def');

        expect(struct.length).toBe(1);
        expect(struct[0]['identifier']).toBe('10');
        expect(struct[0]['shortDescription']).toBe('abc');
        expect(struct[0]['custom']).toBe('def');
    });


    test('two lines', () => {

        const structs = convertCsvRows(',')(
            'a\n' +
            '10\n' +
            '11');

        expect(structs.length).toBe(2);
        expect(structs[0]['a']).toBe('10');
        expect(structs[1]['a']).toBe('11');
    });


    test('parse content with quotes', () => {

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


    test('parse linebreaks in field values', () => {

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


    test('implode struct', () => {

        const content =
            'a.b\n' +
            '100';

        const structs = convertCsvRows(',')(content);
        const struct = structs[0];
        expect(struct['a']['b']).toBe('100');
    });


    test('implode array with nested structure', () => {

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


    test('parse last field in file even if empty', () => {

        const struct = convertCsvRows(',')(
            'a,b\n' +
            'Value,');

        expect(struct.length).toBe(1);
        expect(struct[0]['a']).toBe('Value');
        expect(struct[0]['b']).toBe(null);
    });


    test('parse empty fields on different levels', () => {

        const struct = convertCsvRows(',')(
            'identifier,a\n' +
            '"1",""');

        expect(struct.length).toBe(1);
        expect(struct[0]['a']).toBeNull();

        const struct1 = convertCsvRows(',')(
            'identifier,a.a,a.b\n' +
            '"1","",""');

        expect(struct1.length).toBe(1);
        expect(struct1[0]['a']['b']).toBeNull();

        const struct2 = convertCsvRows(',')(
            'identifier,a.b.d,a.b.c\n' +
            '"1","",""');

        expect(struct2.length).toBe(1);
        expect(struct2[0]['a']['b']['c']).toBeNull();
    });


    test('parse field that contains only linebreak as empty field', () => {

        const struct = convertCsvRows(',')(
            'a\n' +
            '"\n"');

        expect(struct.length).toBe(1);
        expect(struct[0]['a']).toBeNull();
    });


    test('can set array entry to null', () => {

        const struct = convertCsvRows(',')(
            'identifier,a.0\n'
            + '"1",""');

        expect(struct.length).toBe(1);
        expect(struct[0]['a'].length).toBe(1);
        expect(struct[0]['a'][0]).toBeNull();
    });


    test('arrays with 1 entry are legal', () => {

        convertCsvRows(',')('a.0');
        convertCsvRows(',')('a.0.c');
    });


    test('legal case where one entry is longer than the other', () => {

        try {
            convertCsvRows(',')('a.12.a,a.120.b');
            throw new Error('Test failure');
        } catch (expected) {
            if (expected[0] !== CSV_HEADING_ARRAY_INDICES_INVALID_SEQUENCE) throw new Error('Test failure');
        }
    });

    // err cases

    test('inconsistent headings found', () => {

        try {
            convertCsvRows(',')('a,a.0.a');
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([CSV_INVALID_HEADING, 'a']);
        }
    });


    test('inconsistent headings found - array', () => {

        try {
            convertCsvRows(',')('a.10,a.10.a');
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([CSV_INVALID_HEADING, 'a.10']);
        }
    });


    test('inconsistent headings found - object', () => {

        try {
            convertCsvRows(',')('a.b,a.b.c');
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([CSV_INVALID_HEADING, 'a.b']);
        }
    });


    test('do not throw invalid heading error for fields that begin with the same name', () => {

        try {
            convertCsvRows(',')('abc,abcd');
            convertCsvRows(',')('abc.x,abcd');
            convertCsvRows(',')('abc,abcd.x');
        } catch (err) {
            fail(err);
        }
    });


    test('row entries does not match headings length', () => {

        try {
            convertCsvRows(';')('a;b;c\n;');
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([ParserErrors.CSV_ROW_LENGTH_MISMATCH, 1]);
        }

        try {
            convertCsvRows(';')('a;b;c\n;;;');
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([ParserErrors.CSV_ROW_LENGTH_MISMATCH, 1]);
        }
    });


    test('path item mismatch at first element', () => {

        try {
            convertCsvRows(',')('a.b,0.d');
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([ParserErrors.CSV_HEADING_PATH_ITEM_TYPE_MISMATCH, ['a.b', '0.d']]);
        }
    });


    test('path item mismatch at nested element', () => {

        try {
            convertCsvRows(',')('a.b.a.a,a.b.0.b');
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([ParserErrors.CSV_HEADING_PATH_ITEM_TYPE_MISMATCH, ['a.a', '0.b']]);
        }
    });


    test('incomplete array detected', () => {

        try {
            convertCsvRows(',')('a.b.0.a,a.b.0.b,a.b.2');
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([ParserErrors.CSV_HEADING_ARRAY_INDICES_INVALID_SEQUENCE, [0, 2]]);
        }
    });


    test('incomplete array detected - array does not start at 0', () => {

        try {
            convertCsvRows(',')('a.b.1.a,a.b.2.b,a.b.3');
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([ParserErrors.CSV_HEADING_ARRAY_INDICES_INVALID_SEQUENCE, [1, 2, 3]]);
        }
    });


    test('empty heading entry', () => {

        try {
            convertCsvRows(',')(',b');
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([ParserErrors.CSV_HEADING_EMPTY_ENTRY]);
        }
    });


    test('ignore zero-width characters', () => {

        const struct = convertCsvRows(',')(
            '\uFEFFa\n' +
            '\u200BValue 1\n' +
            '\u200CValue 2\n' +
            '\u200DValue 3');

        expect(struct.length).toBe(3);
        expect(struct[0]['a']).toBe('Value 1');
        expect(struct[1]['a']).toBe('Value 2');
        expect(struct[2]['a']).toBe('Value 3');
    });


    test('ignore empty rows', () => {

        const struct = convertCsvRows(',')(
            'identifier,shortDescription,custom\n' +
            '1,abc,def\n' +
            ',,\n' +
            '"","",""');

        expect(struct.length).toBe(1);
        expect(struct[0]['identifier']).toBe('1');
        expect(struct[0]['shortDescription']).toBe('abc');
        expect(struct[0]['custom']).toBe('def');
    });
});
