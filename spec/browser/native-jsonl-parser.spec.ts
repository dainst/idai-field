/// <reference path="../../typings/globals/jasmine/index.d.ts" />
import {NativeJsonlParser} from "../../app/import/native-jsonl-parser";
import {M} from "../../app/m"

/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export function main() {

    describe('NativeJsonlParser', () => {

       it('should create objects from file content', (done) => {

            var fileContent  = '{ "id": "id1", "type": "object", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
                + '{ "id": "id2", "type": "object", "identifier" : "ob2", "title": "Obi-Two Kenobi"}\n'
                + '{ "id": "id3", "type": "object", "identifier" : "ob3", "title": "Obi-Three Kenobi"}';

            var parser = new NativeJsonlParser();
            var objects = [];
            parser.parse(fileContent).subscribe(object => {
                expect(object).not.toBe(undefined);
                objects.push(object);
            }, () => {
                fail();
            }, () => {
                expect(objects[0]['resource']['id']).toEqual("id1");
                expect(objects[0]['resource']['type']).toEqual("object");
                expect(objects[0]['id']).toEqual("id1");
                expect(objects[2]['resource'].title).toEqual("Obi-Three Kenobi");
                expect(objects.length).toEqual(3);
                done();
            });

        });

        it('should abort on syntax errors in file content', (done) => {

            var fileContent = '{ "id": "id1", "type": "object", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
                + '{ "id": "id2", "type": "object", "identifier" : "ob2", "title": "Obi-Two Kenobi"\n'
                + '{ "id": "id3", "type": "object", "identifier" : "ob3", "title": "Obi-Three Kenobi"}';

            var parser = new NativeJsonlParser();
            var objects = [];
            parser.parse(fileContent).subscribe(object => {
                expect(object).not.toBe(undefined);
                objects.push(object);
            }, (error) => {
                expect(objects.length).toEqual(1);
                expect(objects[0]['resource']['id']).toEqual("id1");
                expect(error).toEqual(jasmine.any(SyntaxError));
                expect(error.message).toEqual(M.IMPORTER_FAILURE_INVALIDJSON);
                expect(error.lineNumber).toEqual(2);
                done();
            });

        });

    });
}