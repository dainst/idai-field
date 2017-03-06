import {GeojsonJsonlParser} from "../../../app/import/geojson-jsonl-parser";
import {Document} from "idai-components-2/core";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('GeojsonJsonlParser', () => {

        it('should create a document from file content', (done) => {

            let fileContent  = '{ "type" : "Feature", ' +
                '"geometry" : { "type": "Point", "coordinates": [6.71875,-6.96875] }, ' +
                '"properties" : { "identifier" : "123" } }';

            let parser = new GeojsonJsonlParser();
            let docs: Document[] = [];
            parser.parse(fileContent).subscribe(result => {
                expect(result).not.toBe(undefined);
                docs.push(result.document);
            }, err => {
                fail(err);
                done();
            }, () => {
                expect(docs[0].resource['identifier']).toEqual("123");
                expect(docs[0].resource['geometries'][0]['type']).toEqual("Point");
                done();
            });

        });
    });
}