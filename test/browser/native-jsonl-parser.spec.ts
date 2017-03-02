import {NativeJsonlParser} from "../../app/import/native-jsonl-parser";
import {M} from "../../app/m"

/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export function main() {

    describe('NativeJsonlParser', () => {

       it('should create objects from file content', (done) => {

            let fileContent  = '{ "id": "id1", "type": "object", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
                + '{ "id": "id2", "type": "object", "identifier" : "ob2", "title": "Obi-Two Kenobi"}\n'
                + '{ "id": "id3", "type": "object", "identifier" : "ob3", "title": "Obi-Three Kenobi"}';

            let parser = new NativeJsonlParser();
            let objects = [];
            parser.parse(fileContent).subscribe(result => {
                expect(result).not.toBe(undefined);
                objects.push(result.document);
            }, () => {
                fail();
            }, () => {
                expect(objects[0]['resource']['id']).toEqual("id1");
                expect(objects[0]['resource']['type']).toEqual("object");
                expect(objects[2]['resource'].title).toEqual("Obi-Three Kenobi");
                expect(objects.length).toEqual(3);
                done();
            });

        });

        it('should abort on syntax errors in file content', (done) => {

            let fileContent = '{ "id": "id1", "type": "object", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
                + '{ "id": "id2", "type": "object", "identifier" : "ob2", "title": "Obi-Two Kenobi"\n'
                + '{ "id": "id3", "type": "object", "identifier" : "ob3", "title": "Obi-Three Kenobi"}';

            let parser = new NativeJsonlParser();
            let objects = [];
            parser.parse(fileContent).subscribe(result => {
                expect(result).not.toBe(undefined);
                objects.push(result.document);
            }, (error) => {
                expect(objects.length).toEqual(1);
                expect(objects[0]['resource']['id']).toEqual("id1");
                expect(error).toEqual([M.IMPORTER_FAILURE_INVALIDJSON,2]);
                done();
            });

        });

    });
}