import {CsvRowsConversion} from '../../../../../app/core/import/parser/csv-rows-conversion';
import {CsvParser} from '../../../../../app/core/import/parser/csv-parser';
import SEP = CsvParser.SEP;

/**
 * @author Daniel de Oliveira
 */
describe('CsvRowsConversion', () => {


    it('three fields', () => {

        const struct = CsvRowsConversion.parse(SEP)([
            'identifier,shortDescription,custom',
            '10,zehn,bla']);

        expect(struct.length).toBe(1);
        expect(struct[0]['identifier']).toBe('10');
        expect(struct[0]['shortDescription']).toBe('zehn');
        expect(struct[0]['custom']).toBe('bla');
    });


    it('two lines', () => {

        const structs = CsvRowsConversion.parse(SEP)([
            'a',
            '10',
            '11']);

        expect(structs.length).toBe(2);
        expect(structs[0]['a']).toBe('10');
        expect(structs[1]['a']).toBe('11');
    });


    it('implode struct', () => {

        const lines = [
            'a.b',
            '100'];

        const structs = CsvRowsConversion.parse(SEP)(lines);
        const struct = structs[0];
        expect(struct['a']['b']).toBe('100');
    });


    it('implode array with nested structure', () => {

        const lines = [
            'identifier,array.0.begin.year,array.0.end.year,array.0.source,array.0.label',
            'identifier1,100,200,S,L'];

        const structs = CsvRowsConversion.parse(SEP)(lines);
        expect(structs.length).toBe(1);

        const struct = structs[0];
        expect(struct['identifier']).toBe('identifier1');
        expect(struct['array'][0].begin.year).toBe('100');
        expect(struct['array'][0].end.year).toBe('200');
        expect(struct['array'][0].source).toBe('S');
        expect(struct['array'][0].label).toBe('L');
    });


    it('make sure arrays are dense', () => {

        const lines = [
            'a.1.b.c',
            '10'];

        const structs = CsvRowsConversion.parse(SEP)(lines);
        const struct = structs[0];
        const nrEnumeratedItems = struct['a'].reduce((sum, _) => sum + 1, 0);
        expect(nrEnumeratedItems).toBe(2);
    })
});