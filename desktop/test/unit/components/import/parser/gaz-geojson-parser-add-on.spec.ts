import { Document } from 'idai-field-core';
import { GeojsonParser } from '../../../../../src/app/components/import/parser/geojson-parser';
import { GazGeojsonParserAddOn } from '../../../../../src/app/components/import/parser/gaz-geojson-parser-add-on';
import { ParserErrors } from '../../../../../src/app/components/import/parser/parser-errors';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('GazGeojsonParserAddOn', () => {

    function expectErr(fileContent, which, done) {

        const parse = GeojsonParser.getParse(GazGeojsonParserAddOn.preValidateAndTransformFeature, GazGeojsonParserAddOn.postProcess);
        parse(fileContent).then(() => {
            fail('should not emit next');
        }, err => {
            expect(err[0]).toBe(which);
            done();
        });
    }


    it('should import gazetteer geojson', done => {

        const fileContent  = '{ "type" : "FeatureCollection", "features" : [ { "type": "Feature", "geometry": {' +
            '"type": "Point", "coordinates": [6.71875,-6.96875] }, "properties": { "gazId": "2312125", "identifier": "https://gazetteer.dainst.org/place/2312125" } }' +
            '] }';

        const parse = GeojsonParser.getParse(
            GazGeojsonParserAddOn.preValidateAndTransformFeature,
            GazGeojsonParserAddOn.postProcess);
        const docs: Document[] = [];
        parse(fileContent).then(docs => {
            // expect(resultDocument).not.toBe(undefined);
            // docs.push(resultDocument);

            expect(docs[0].resource['id']).toEqual('gazetteer2312125');
            expect(docs[0].resource['identifier']).toEqual('2312125');
            expect(docs[0].resource['geometry']['type']).toEqual('Point');

            expect(docs.length).toEqual(1);
            done();

        }, err => {
            fail(err);
            done();
        });
    });


    it('should not import gazetteer geojson - no gaz id', done => {

        const fileContent  = '{ "type" : "FeatureCollection", "features" : [ { "type": "Feature", "geometry": {' +
            '"type": "Point", "coordinates": [6.71875,-6.96875] }, "properties": { "identifier": "https://gazetteer.dainst.org/place/2312125" } }' +
            '] }';

        expectErr(fileContent, ParserErrors.INVALID_GEOJSON_IMPORT_STRUCT, done);
    });
});
