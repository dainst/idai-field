import { Document } from 'idai-field-core';
import { GeojsonParser } from '../../../../../src/app/components/import/parser/geojson-parser';
import { ParserErrors } from '../../../../../src/app/components/import/parser/parser-errors';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('GeojsonParser', () => {


    function expectErr(fileContent, which, done) {

        const parse = GeojsonParser.getParse(undefined, undefined);
        parse(fileContent).then(() => {
            fail('should not emit next');
        }, err => {
            expect(err[0]).toBe(which);
            done();
        });
    }


    it('should take a feature collection and make documents', done => {

        const fileContent  = '{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { "identifier": "122" } }, ' +
            '{ "type": "Feature", "geometry": { "type": "Polygon", ' +
            '"coordinates": [ [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0] ] }, ' +
            '"properties" : {"identifier":"123"} } ] }';

        const parse = GeojsonParser.getParse(undefined, undefined);

        parse(fileContent).then(docs => {
            // expect(resultDocument).not.toBe(undefined);
            // docs.push(resultDocument);
            expect(docs[0].resource['identifier']).toEqual('122');
            expect(docs[0].resource['geometry']['type']).toEqual('Point');

            expect(docs[1].resource['identifier']).toEqual('123');
            expect(docs[1].resource['geometry']['type']).toEqual('Polygon');

            expect(docs.length).toEqual(2);
            done();
        }, err => {
            fail(err);
            done();
        });
    });


    it('do not add empty fields for fields not mentioned in import file', async done => {

        const fileContent  = '{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { "identifier": "122" } }] }';

        const parse = GeojsonParser.getParse(undefined, undefined);
        const docs: Document[] = await parse(fileContent);

        expect(Object.getOwnPropertyNames(docs[0])).not.toContain('shortDescription');

        done();
    });


    it('should emit an error on invalid json', done => {

        expectErr('{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { "identifier": "122" } }, ' +
            '{ "type": "Feature", "geometry": { "type": "LineString", ' +
            '"coordinates": [ [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0] ] }, ' +
            '"properties" : {"identifier":"123"} }' +
            '] ' // missing closing brace
            , ParserErrors.FILE_INVALID_JSON, done);
    });


    it('should emit an error on invalid structure', done => {

        expectErr('{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { "identifier": "122" } } '
            , ParserErrors.INVALID_GEOJSON_IMPORT_STRUCT, done);
    });


    it('should emit an error on unsupported type', done => {

        expectErr('{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "GeometryCollection?", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { "identifier": "122" } } ] }'
            , ParserErrors.INVALID_GEOJSON_IMPORT_STRUCT, done);
    });


    it('should emit an error missing identifier', done => {

        expectErr('{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { } } ] }'
            , ParserErrors.MISSING_IDENTIFIER, done);
    });


    it('should emit an error missing properties', done => {

        expectErr('{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }} ] }'
            , ParserErrors.MISSING_IDENTIFIER, done);
    });


    it('should emit on numerical identifier', done => {

        expectErr('{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { "identifier": 122 } } ] }'
            , ParserErrors.WRONG_IDENTIFIER_FORMAT, done);
    });
});
