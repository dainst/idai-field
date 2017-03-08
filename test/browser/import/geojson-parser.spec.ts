import {GeojsonParser} from "../../../app/import/geojson-parser";
import {Document} from "idai-components-2/core";
import {M} from "../../../app/m";

/**
 * @author Daniel de Oliveira
 */
export function main() {
    describe('GeojsonParser', () => {

        // it('should create a document from file content', (done) => {
        //
        //     let fileContent  = '{ "type" : "Feature", ' +
        //         '"geometry" : { "type": "Point", "coordinates": [6.71875,-6.96875] }, ' +
        //         '"properties" : { "identifier" : "123" } }';
        //
        //     let parser = new GeojsonJsonlParser();
        //     let docs: Document[] = [];
        //     parser.parse(fileContent).subscribe(resultDocument => {
        //         expect(resultDocument).not.toBe(undefined);
        //         docs.push(resultDocument);
        //     }, err => {
        //         fail(err);
        //         done();
        //     }, () => {
        //         expect(docs[0].resource['identifier']).toEqual("123");
        //         expect(docs[0].resource['geometries'][0]['type']).toEqual("Point");
        //         done();
        //     });
        // });

        it('should take a feature collection and make documents', (done) => {

            let fileContent  = '{ "type": "FeatureCollection", "features": [' +
                '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [102.0, 0.5] }, "properties": { "identifier": "122" } }, ' +
                '{ "type": "Feature", "geometry": { "type": "LineString", "coordinates": [ [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0] ] }, "properties" : {"identifier":"123"} }' +
                '] }';

            let parser = new GeojsonParser();
            let docs: Document[] = [];
            parser.parse(fileContent).subscribe(resultDocument => {
                expect(resultDocument).not.toBe(undefined);
                docs.push(resultDocument);
            }, err => {
                fail(err);
                done();
            }, () => {
                expect(docs[0].resource['identifier']).toEqual("122");
                expect(docs[0].resource['geometry']['type']).toEqual("Point");

                expect(docs[1].resource['identifier']).toEqual("123");
                expect(docs[1].resource['geometry']['type']).toEqual("LineString");

                expect(docs.length).toEqual(2);
                // expect(parser.getWarnings()[0]).toEqual([M.IMPORTER_WARNING_NOMULTIPOLYGONSUPPORT]);
                done();
            });
        });
    });
}