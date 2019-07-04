import {CsvRowsConversion} from '../../../../../app/core/import/parser/csv-rows-conversion';
import {PARENT} from '../../../../../app/c';
import {CsvParser} from '../../../../../app/core/import/parser/csv-parser';
import SEP = CsvParser.SEP;


describe('CsvRowsConversion', () => {

    const EMPTY = '';

    it('basics', () => {

        const documents = CsvRowsConversion.parse( 'type1', SEP, EMPTY)(['identifier,shortDescription,custom', '10,zehn,bla']);
        expect(documents.length).toBe(1);
        expect(documents[0].resource.identifier).toBe('10');
        expect(documents[0].resource.shortDescription).toBe('zehn');
        expect(documents[0].resource.custom).toBe('bla');
        expect(documents[0].resource.type).toBe('type1');
    });


    it('assign operation id', () => {

        const documents = CsvRowsConversion.parse( 'type1', SEP, 'operationId1')(['identifier,shortDescription,custom', '10,zehn,bla']);
        expect(documents.length).toBe(1);
        expect(documents[0].resource.relations['isChildOf']).toBe('operationId1');
    });


    it('implode datings', () => {

        const lines = ['identifier,dating.0.begin.year,dating.0.end.year,dating.0.source,dating.0.label',
            'identifier1,100,200,S,L'];

        const documents = CsvRowsConversion.parse('type1', SEP, EMPTY)(lines);
        expect(documents.length).toBe(1);

        const resource = documents[0].resource;
        expect(resource.identifier).toBe('identifier1');
        expect(resource.dating[0].begin.year).toBe('100');
        expect(resource.dating[0].end.year).toBe('200');
        expect(resource.dating[0].source).toBe('S');
        expect(resource.dating[0].label).toBe('L');
    });


    it('implode dimensions', () => {

        const lines = ['identifier,dimensionX.value', 'identifier1,100'];

        const documents = CsvRowsConversion.parse( 'type1', SEP, EMPTY)(lines);
        const resource = documents[0].resource;
        expect(resource['dimensionX']['value']).toBe('100');
    });


    it('implode relations', () => { // relations are also nested, but sometimes treated differently

        const lines = ['identifier,relations.isChildOf', 'identifier1,identifier2'];

        const documents = CsvRowsConversion.parse( 'type1', SEP, EMPTY)(lines);
        const resource = documents[0].resource;
        expect(resource.relations[PARENT]).toBe('identifier2');
    });
});