import {GeojsonParser} from '../../../../app/core/import/geojson-parser';
import {Document} from 'idai-components-2';
import {M} from '../../../../app/components/m';
import {ImportErrors} from '../../../../app/core/import/import-errors';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('GeojsonParser', () => {

    function expectErr(fileContent, which, done, gazetteerMode = false) {

        const parser = new GeojsonParser(gazetteerMode);
        parser.parse(fileContent).subscribe(() => {
            fail('should not emit next');
        }, err => {
            expect(err[0]).toBe(which);
            done();
        }, () => fail('should not complete'));
    }

    it('should take a feature collection and make documents', done => {

        const fileContent  = '{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { "identifier": "122" } }, ' +
            '{ "type": "Feature", "geometry": { "type": "Polygon", ' +
            '"coordinates": [ [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0] ] }, ' +
            '"properties" : {"identifier":"123"} } ] }';

        const parser = new GeojsonParser();
        const docs: Document[] = [];
        parser.parse(fileContent).subscribe(resultDocument => {
            expect(resultDocument).not.toBe(undefined);
            docs.push(resultDocument);
        }, err => {
            fail(err);
            done();
        }, () => {
            expect(docs[0].resource['identifier']).toEqual('122');
            expect(docs[0].resource['geometry']['type']).toEqual('Point');

            expect(docs[1].resource['identifier']).toEqual('123');
            expect(docs[1].resource['geometry']['type']).toEqual('Polygon');

            expect(docs.length).toEqual(2);
            done();
        });
    });

    it('should emit an error on invalid json', done => {

        expectErr('{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { "identifier": "122" } }, ' +
            '{ "type": "Feature", "geometry": { "type": "LineString", ' +
            '"coordinates": [ [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0] ] }, ' +
            '"properties" : {"identifier":"123"} }' +
            '] ' // missing closing brace
            , ImportErrors.FILE_INVALID_JSON, done);
    });

    it('should emit an error on invalid structure', done => {

        expectErr('{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { "identifier": "122" } } '
            , ImportErrors.INVALID_GEOJSON_IMPORT_STRUCT, done);
    });


    it('should emit an error on unsupported type', done => {

        expectErr('{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "GeometryCollection?", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { "identifier": "122" } } ] }'
            , ImportErrors.INVALID_GEOJSON_IMPORT_STRUCT, done);
    });


    it('should emit an error missing identifier', done => {

        expectErr('{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { } } ] }'
            , ImportErrors.MISSING_IDENTIFIER, done);
    });


    it('should emit an error missing properties', done => {

        expectErr('{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }} ] }'
            , ImportErrors.MISSING_IDENTIFIER, done);
    });


    it('should emit on numerical identifier', done => {

        expectErr('{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { "identifier": 122 } } ] }'
            , ImportErrors.WRONG_IDENTIFIER_FORMAT, done);
    });


    it('should produce a warning on duplicate identifiers', done => {

        const fileContent  = '{ "type" : "FeatureCollection", "features" : [ { "type": "Feature", "geometry": {' +
            '"type": "Point", "coordinates": [6.71875,-6.96875] }, "properties": { "identifier": "id1" } },' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [16.71875,-16.96875] },' +
            '"properties": { "identifier": "id1" } } ] }';

        const parser = new GeojsonParser();
        parser.parse(fileContent).subscribe(resultDocument => {
            expect(resultDocument).not.toBe(undefined);
        }, err => {
            fail(err);
            done();
        }, () => {
            const warnings = parser.getWarnings();
            expect(warnings.length).toBe(1);
            expect(warnings[0][0]).toEqual(M.IMPORT_WARNING_GEOJSON_DUPLICATE_IDENTIFIER);
            expect(warnings[0][1]).toEqual('id1');
            done();
        });
    });


    it('should import gazetteer geojson', done => {

        const fileContent  = '{ "type" : "FeatureCollection", "features" : [ { "type": "Feature", "geometry": {' +
            '"type": "Point", "coordinates": [6.71875,-6.96875] }, "properties": { "gazId": "2312125", "identifier": "https://gazetteer.dainst.org/place/2312125" } }' +
            '] }';

        const parser = new GeojsonParser(true);
        const docs: Document[] = [];
        parser.parse(fileContent).subscribe(resultDocument => {
            expect(resultDocument).not.toBe(undefined);
            docs.push(resultDocument);
        }, err => {
            fail(err);
            done();
        }, () => {

            expect(docs[0].resource['id']).toEqual('2312125');
            expect(docs[0].resource['identifier']).toEqual('2312125');
            expect(docs[0].resource['geometry']['type']).toEqual('Point');

            expect(docs.length).toEqual(1);
            done();
        });
    });


    it('should not import gazetteer geojson - no gaz id', done => {

        const fileContent  = '{ "type" : "FeatureCollection", "features" : [ { "type": "Feature", "geometry": {' +
            '"type": "Point", "coordinates": [6.71875,-6.96875] }, "properties": { "identifier": "https://gazetteer.dainst.org/place/2312125" } }' +
            '] }';

        expectErr(fileContent
            , ImportErrors.INVALID_GEOJSON_IMPORT_STRUCT, done, true);
    });
});