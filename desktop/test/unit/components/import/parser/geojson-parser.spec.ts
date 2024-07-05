import { describe, expect, test } from '@jest/globals';
import { Document } from 'idai-field-core';
import { GeojsonParser } from '../../../../../src/app/components/import/parser/geojson-parser';
import { ParserErrors } from '../../../../../src/app/components/import/parser/parser-errors';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('GeojsonParser', () => {

    async function expectError(fileContent, expectedError) {

        try {
            const parse = GeojsonParser.getParse(undefined, undefined);
            await parse(fileContent);
            throw new Error('Test failure');
        } catch (err) {
            expect(err[0]).toBe(expectedError);
        }
    }


    test('should take a feature collection and make documents', async () => {

        const fileContent  = '{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { "identifier": "122" } }, ' +
            '{ "type": "Feature", "geometry": { "type": "Polygon", ' +
            '"coordinates": [ [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0] ] }, ' +
            '"properties" : {"identifier":"123"} } ] }';

        const parse = GeojsonParser.getParse(undefined, undefined);

        const documents = await parse(fileContent);

        expect(documents[0].resource['identifier']).toEqual('122');
        expect(documents[0].resource['geometry']['type']).toEqual('Point');

        expect(documents[1].resource['identifier']).toEqual('123');
        expect(documents[1].resource['geometry']['type']).toEqual('Polygon');

        expect(documents.length).toEqual(2);
    });


    test('do not add empty fields for fields not mentioned in import file', async () => {

        const fileContent  = '{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { "identifier": "122" } }] }';

        const parse = GeojsonParser.getParse(undefined, undefined);
        const documents: Document[] = await parse(fileContent);

        expect(Object.getOwnPropertyNames(documents[0])).not.toContain('shortDescription');
    });


    test('should emit an error on invalid json', () => {

        expectError(
            '{ "type": "FeatureCollection", "features": ['
            + '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, '
            + '"properties": { "identifier": "122" } }, '
            + '{ "type": "Feature", "geometry": { "type": "LineString", '
            + '"coordinates": [ [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0] ] }, '
            + '"properties" : {"identifier":"123"} }'
            + '] ', // missing closing brace
            ParserErrors.FILE_INVALID_JSON
        );
    });


    test('should emit an error on invalid structure', () => {

        expectError(
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, '
            + '"properties": { "identifier": "122" } } ',
            ParserErrors.INVALID_GEOJSON_IMPORT_STRUCT
        );
    });


    test('should emit an error on unsupported type', () => {

        expectError(
            '{ "type": "FeatureCollection", "features": ['
            + '{ "type": "Feature", "geometry": { "type": "GeometryCollection?", "coordinates": [102.0, 0.5] }, '
            + '"properties": { "identifier": "122" } } ] }',
            ParserErrors.INVALID_GEOJSON_IMPORT_STRUCT
        );
    });


    test('should emit an error missing identifier', () => {

        expectError(
            '{ "type": "FeatureCollection", "features": ['
            + '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, '
            + '"properties": { } } ] }',
            ParserErrors.MISSING_IDENTIFIER
        );
    });


    test('should emit an error missing properties', () => {

        expectError(
            '{ "type": "FeatureCollection", "features": ['
            + '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }} ] }',
            ParserErrors.MISSING_IDENTIFIER
        );
    });


    test('should emit on numerical identifier', () => {

        expectError(
            '{ "type": "FeatureCollection", "features": ['
            + '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, '
            + '"properties": { "identifier": 122 } } ] }',
            ParserErrors.WRONG_IDENTIFIER_FORMAT
        );
    });
});
