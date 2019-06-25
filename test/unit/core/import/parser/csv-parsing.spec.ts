import {CsvParsing} from '../../../../../app/core/import/parser/csv-parsing';


describe('CsvParsing', () => {

    it('basics', () => {

        const documents = CsvParsing.parse('identifier,shortDescription,custom\n10,zehn,bla', 'type1');
        expect(documents.length).toBe(1);
        expect(documents[0].resource.identifier).toBe('10');
        expect(documents[0].resource.shortDescription).toBe('zehn');
        expect(documents[0].resource.custom).toBe('bla');
        expect(documents[0].resource.type).toBe('type1');
    });
});