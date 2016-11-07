"use strict";
/// <reference path="../../typings/globals/jasmine/index.d.ts" />
var idig_csv_parser_1 = require("../../app/import/idig-csv-parser");
var m_1 = require("../../app/m");
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
function main() {
    describe('IdigCsvParser', function () {
        it('should create objects from file content', function (done) {
            var fileContent = 'IdentifierUUID,Identifier,Title,Type\n'
                + '1,one,One,context\n'
                + '2,two,Two,context\n';
            var parser = new idig_csv_parser_1.IdigCsvParser();
            var objects = [];
            parser.parse(fileContent).subscribe(function (object) {
                expect(object).not.toBe(undefined);
                objects.push(object);
            }, function () {
                fail();
            }, function () {
                expect(objects[0]['resource']['id']).toEqual("1");
                expect(objects[0]['resource']['type']).toEqual("context");
                expect(objects[0]['id']).toEqual("1");
                expect(objects[1]['resource'].shortDescription).toEqual("Two");
                expect(objects.length).toEqual(2);
                done();
            });
        });
        it('should abort on syntax errors in file content', function (done) {
            var fileContent = 'IdentifierUUID,Identifier,Title,Type\n'
                + '1,one,One,context\n'
                + ',two,Two,context\n';
            var parser = new idig_csv_parser_1.IdigCsvParser();
            var objects = [];
            parser.parse(fileContent).subscribe(function (object) {
                expect(object).not.toBe(undefined);
                objects.push(object);
            }, function (error) {
                expect(objects.length).toEqual(1);
                expect(objects[0]['resource']['id']).toEqual("1");
                expect(error).toEqual(jasmine.any(SyntaxError));
                expect(error.message).toEqual(m_1.M.IMPORTER_FAILURE_MANDATORYCSVFIELDMISSING);
                expect(error.lineNumber).toEqual(2);
                done();
            });
        });
    });
}
exports.main = main;
