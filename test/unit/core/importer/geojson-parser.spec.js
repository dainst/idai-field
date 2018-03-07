"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var geojson_parser_1 = require("../../../../app/core/importer/geojson-parser");
var m_1 = require("../../../../app/m");
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('GeojsonParser', function () {
    function expectErr(fileContent, which, done) {
        var parser = new geojson_parser_1.GeojsonParser();
        parser.parse(fileContent).subscribe(function () {
            fail('should not emit next');
        }, function (err) {
            expect(err[0]).toBe(which);
            done();
        }, function () { return fail('should not complete'); });
    }
    it('should take a feature collection and make documents', function (done) {
        var fileContent = '{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { "identifier": "122" } }, ' +
            '{ "type": "Feature", "geometry": { "type": "Polygon", ' +
            '"coordinates": [ [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0] ] }, ' +
            '"properties" : {"identifier":"123"} } ] }';
        var parser = new geojson_parser_1.GeojsonParser();
        var docs = [];
        parser.parse(fileContent).subscribe(function (resultDocument) {
            expect(resultDocument).not.toBe(undefined);
            docs.push(resultDocument);
        }, function (err) {
            fail(err);
            done();
        }, function () {
            expect(docs[0].resource['identifier']).toEqual('122');
            expect(docs[0].resource['geometry']['type']).toEqual('Point');
            expect(docs[1].resource['identifier']).toEqual('123');
            expect(docs[1].resource['geometry']['type']).toEqual('Polygon');
            expect(docs.length).toEqual(2);
            done();
        });
    });
    it('should emit an error on invalid json', function (done) {
        expectErr('{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { "identifier": "122" } }, ' +
            '{ "type": "Feature", "geometry": { "type": "LineString", ' +
            '"coordinates": [ [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0] ] }, ' +
            '"properties" : {"identifier":"123"} }' +
            '] ' // missing closing brace
        , m_1.M.IMPORT_FAILURE_INVALIDJSON, done);
    });
    it('should emit an error on invalid structure', function (done) {
        expectErr('{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { "identifier": "122" } } ', m_1.M.IMPORT_FAILURE_INVALID_GEOJSON_IMPORT_STRUCT, done);
    });
    it('should emit an error on unsupported type', function (done) {
        expectErr('{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "GeometryCollection", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { "identifier": "122" } } ] }', m_1.M.IMPORT_FAILURE_INVALID_GEOJSON_IMPORT_STRUCT, done);
    });
    it('should emit an error missing identifier', function (done) {
        expectErr('{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { } } ] }', m_1.M.IMPORT_FAILURE_MISSING_IDENTIFIER, done);
    });
    it('should emit an error missing properties', function (done) {
        expectErr('{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }} ] }', m_1.M.IMPORT_FAILURE_MISSING_IDENTIFIER, done);
    });
    it('should emit on numerical identifier', function (done) {
        expectErr('{ "type": "FeatureCollection", "features": [' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, ' +
            '"properties": { "identifier": 122 } } ] }', m_1.M.IMPORT_FAILURE_IDENTIFIER_FORMAT, done);
    });
    it('should produce a warning on duplicate identifiers', function (done) {
        var fileContent = '{ "type" : "FeatureCollection", "features" : [ { "type": "Feature", "geometry": {' +
            '"type": "Point", "coordinates": [6.71875,-6.96875] }, "properties": { "identifier": "id1" } },' +
            '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [16.71875,-16.96875] },' +
            '"properties": { "identifier": "id1" } } ] }';
        var parser = new geojson_parser_1.GeojsonParser();
        parser.parse(fileContent).subscribe(function (resultDocument) {
            expect(resultDocument).not.toBe(undefined);
        }, function (err) {
            fail(err);
            done();
        }, function () {
            var warnings = parser.getWarnings();
            expect(warnings.length).toBe(1);
            expect(warnings[0][0]).toEqual(m_1.M.IMPORT_WARNING_GEOJSON_DUPLICATE_IDENTIFIER);
            expect(warnings[0][1]).toEqual('id1');
            done();
        });
    });
});
//# sourceMappingURL=geojson-parser.spec.js.map