import {GeojsonParser} from '../../../../app/core/import/geojson-parser';
import {Document} from 'idai-components-2';
import {ImportErrors} from '../../../../app/core/import/import-errors';
import {GazGeojsonParserAddOn} from '../../../../app/core/import/gaz-geojson-parser-add-on';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('GazGeojsonParserAddOn', () => {

    function expectErr(fileContent, which, done) {

        const parser = new GeojsonParser(GazGeojsonParserAddOn.preValidateAndTransformFeature, GazGeojsonParserAddOn.postProcess);
        parser.parse(fileContent).subscribe(() => {
            fail('should not emit next');
        }, err => {
            expect(err[0]).toBe(which);
            done();
        }, () => fail('should not complete'));
    }


    it('should import gazetteer geojson', done => {

        const fileContent  = '{ "type" : "FeatureCollection", "features" : [ { "type": "Feature", "geometry": {' +
            '"type": "Point", "coordinates": [6.71875,-6.96875] }, "properties": { "gazId": "2312125", "identifier": "https://gazetteer.dainst.org/place/2312125" } }' +
            '] }';

        const parser = new GeojsonParser(
            GazGeojsonParserAddOn.preValidateAndTransformFeature,
            GazGeojsonParserAddOn.postProcess);
        const docs: Document[] = [];
        parser.parse(fileContent).subscribe(resultDocument => {
            expect(resultDocument).not.toBe(undefined);
            docs.push(resultDocument);
        }, err => {
            fail(err);
            done();
        }, () => {

            expect(docs[0].resource['id']).toEqual('gazetteer2312125');
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

        expectErr(fileContent, ImportErrors.PARSER_INVALID_GEOJSON_IMPORT_STRUCT, done);
    });
});