import {CsvRowsConversion} from '../../../../../app/core/import/parser/csv-rows-conversion';
import {PARENT} from '../../../../../app/c';
import {CsvParser} from '../../../../../app/core/import/parser/csv-parser';
import SEP = CsvParser.SEP;


describe('CsvRowsConversion', () => {


    it('basics', () => {

        const resources = CsvRowsConversion.parse(SEP)(['identifier,shortDescription,custom', '10,zehn,bla']);
        expect(resources.length).toBe(1);
        expect(resources[0].identifier).toBe('10');
        expect(resources[0].shortDescription).toBe('zehn');
        expect(resources[0].custom).toBe('bla');
    });


    it('implode datings', () => {

        const lines = ['identifier,dating.0.begin.year,dating.0.end.year,dating.0.source,dating.0.label',
            'identifier1,100,200,S,L'];

        const resources = CsvRowsConversion.parse(SEP)(lines);
        expect(resources.length).toBe(1);

        const resource = resources[0];
        expect(resource.identifier).toBe('identifier1');
        expect(resource.dating[0].begin.year).toBe('100');
        expect(resource.dating[0].end.year).toBe('200');
        expect(resource.dating[0].source).toBe('S');
        expect(resource.dating[0].label).toBe('L');
    });


    it('implode dimensions', () => {

        const lines = ['identifier,dimensionX.value', 'identifier1,100'];

        const resources = CsvRowsConversion.parse(SEP)(lines);
        const resource = resources[0];
        expect(resource['dimensionX']['value']).toBe('100');
    });


    it('implode relations', () => { // relations are also nested, but sometimes treated differently

        const lines = ['identifier,relations.isChildOf', 'identifier1,identifier2'];

        const resources = CsvRowsConversion.parse( SEP)(lines);
        const resource = resources[0];
        expect(resource.relations[PARENT]).toBe('identifier2');
    });
});