"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var native_jsonl_parser_1 = require("../../../../app/core/importer/native-jsonl-parser");
var m_1 = require("../../../../app/m");
/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
describe('NativeJsonlParser', function () {
    beforeEach(function () {
        spyOn(console, 'error'); // to suppress console.error output
    });
    it('should create objects from file content', function (done) {
        var fileContent = '{ "id": "id1", "type": "Find", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
            + '{ "id": "id2", "type": "Find", "identifier" : "ob2", "title": "Obi-Two Kenobi"}\n'
            + '{ "id": "id3", "type": "Find", "identifier" : "ob3", "title": "Obi-Three Kenobi"}';
        var parser = new native_jsonl_parser_1.NativeJsonlParser();
        var objects = [];
        parser.parse(fileContent).subscribe(function (resultDocument) {
            expect(resultDocument).not.toBe(undefined);
            objects.push(resultDocument);
        }, function () {
            fail();
            done();
        }, function () {
            expect(objects[0]['resource']['id']).toEqual('id1');
            expect(objects[0]['resource']['type']).toEqual('Find');
            expect(objects[2]['resource'].title).toEqual('Obi-Three Kenobi');
            expect(objects.length).toEqual(3);
            done();
        });
    });
    it('should abort on syntax errors in file content', function (done) {
        var fileContent = '{ "id": "id1", "type": "Find", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
            + '{ "id": "id2", "type": "Find", "identifier" : "ob2", "title": "Obi-Two Kenobi"\n'
            + '{ "id": "id3", "type": "Find", "identifier" : "ob3", "title": "Obi-Three Kenobi"}';
        var parser = new native_jsonl_parser_1.NativeJsonlParser();
        var objects = [];
        parser.parse(fileContent).subscribe(function (resultDocument) {
            expect(resultDocument).not.toBe(undefined);
            objects.push(resultDocument);
        }, function (error) {
            expect(objects.length).toEqual(1);
            expect(objects[0]['resource']['id']).toEqual('id1');
            expect(error).toEqual([m_1.M.IMPORT_FAILURE_INVALIDJSONL, 2]);
            done();
        });
    });
});
//# sourceMappingURL=native-jsonl-parser.spec.js.map