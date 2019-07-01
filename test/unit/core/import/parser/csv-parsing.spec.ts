import {CsvParsing} from '../../../../../app/core/import/parser/csv-parsing';


describe('CsvParsing', () => {

    it('basics', () => {

        const documents = CsvParsing.parse("abc");
        expect(documents.length).toBe(0);
    });
});