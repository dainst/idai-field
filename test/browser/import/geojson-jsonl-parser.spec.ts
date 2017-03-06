import {GeojsonJsonlParser} from "../../../app/import/geojson-jsonl-parser";
import {Document} from "idai-components-2/core";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('GeojsonJsonlParser', () => {

        it('should create objects from file content', (done) => {

            let fileContent  = '{ "properties" : { "identifier" : "123" } }';

            let parser = new GeojsonJsonlParser();
            let docs: Document[] = [];
            parser.parse(fileContent).subscribe(result => {
                expect(result).not.toBe(undefined);
                docs.push(result.document);
            }, () => {
                fail();
                done();
            }, () => {
                expect(docs[0].resource['identifier']).toEqual("123");
                done();
            });

        });
    });
}