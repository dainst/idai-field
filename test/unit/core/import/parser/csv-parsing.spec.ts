import {CsvParsing} from '../../../../../app/core/import/parser/csv-parsing';
import {PARENT} from '../../../../../app/c';


describe('CsvParsing', () => {

    it('basics', () => {

        const documents = CsvParsing.parse('identifier,shortDescription,custom\n10,zehn,bla', 'type1', ',', '');
        expect(documents.length).toBe(1);
        expect(documents[0].resource.identifier).toBe('10'); // TODO should be number
        expect(documents[0].resource.shortDescription).toBe('zehn');
        expect(documents[0].resource.custom).toBe('bla');
        expect(documents[0].resource.type).toBe('type1');
    });


    it('implode datings', () => {

        const lines = 'identifier,dating.0.begin.year,dating.0.end.year,dating.0.source,dating.0.label\n'
            + 'identifier1,100,200,S,L';

        const documents = CsvParsing.parse(lines, 'type1', ',', '');
        expect(documents.length).toBe(1);

        const resource = documents[0].resource;
        expect(resource.identifier).toBe('identifier1');
        expect(resource.dating[0].begin.year).toBe('100');
        expect(resource.dating[0].end.year).toBe('200');
        expect(resource.dating[0].source).toBe('S');
        expect(resource.dating[0].label).toBe('L');
    });


    it('implode relations', () => {

        const lines = 'identifier,relations.isChildOf\n'
            + 'identifier1,identifier2';

        const documents = CsvParsing.parse(lines, 'type1', ',', '');
        const resource = documents[0].resource;
        expect(resource.relations[PARENT]).toBe('identifier2');
    });
});