import { GeojsonParser } from '../../../../../src/app/components/import/parser/geojson-parser';
import { GazGeojsonParserAddOn } from '../../../../../src/app/components/import/parser/gaz-geojson-parser-add-on';
import { ParserErrors } from '../../../../../src/app/components/import/parser/parser-errors';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('GazGeojsonParserAddOn', () => {

    async function expectError(fileContent, expectedError) {

        const parse = GeojsonParser.getParse(
            GazGeojsonParserAddOn.preValidateAndTransformFeature,
            GazGeojsonParserAddOn.postProcess
        );

        try {
            await parse(fileContent);
            throw new Error('Test failure');
        } catch (err) {
            expect(err[0]).toBe(expectedError);
        }
    }


    test('should import gazetteer geojson', async () => {

        const fileContent  = '{ "type" : "FeatureCollection", "features" : [ { "type": "Feature", "geometry": {'
            + '"type": "Point", "coordinates": [6.71875,-6.96875] }, "properties": { "gazId": "2312125", '
            + '"identifier": "https://gazetteer.dainst.org/place/2312125" } }'
            + '] }';

        const parse = GeojsonParser.getParse(
            GazGeojsonParserAddOn.preValidateAndTransformFeature,
            GazGeojsonParserAddOn.postProcess
        );
        const docs = await parse(fileContent);

        expect(docs[0].resource['id']).toEqual('gazetteer2312125');
        expect(docs[0].resource['identifier']).toEqual('2312125');
        expect(docs[0].resource['geometry']['type']).toEqual('Point');
        
        expect(docs.length).toEqual(1);
    });


    test('should not import gazetteer geojson - no gaz id', () => {

        const fileContent  = '{ "type" : "FeatureCollection", "features" : [ { "type": "Feature", "geometry": {'
            + '"type": "Point", "coordinates": [6.71875,-6.96875] }, "properties": { "identifier": '
            + '"https://gazetteer.dainst.org/place/2312125" } }'
            + '] }';

        expectError(fileContent, ParserErrors.INVALID_GEOJSON_IMPORT_STRUCT);
    });
});
