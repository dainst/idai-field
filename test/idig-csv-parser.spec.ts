import {describe, expect, it} from '@angular/core/testing';
import {IdigCsvParser} from "../app/import/idig-csv-parser";
import {M} from "../app/m";

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export function main() {

    describe('IdigCsvParser', () => {

        it('should create objects from file content', (done) => {

            var fileContent  = 'Identifier_uuid,Identifier,Title,Type\n'
                + '1,one,One,context\n'
                + '2,two,Two,context\n';

            var parser = new IdigCsvParser();
            var objects = [];
            parser.parse(fileContent).subscribe(object => {
                expect(object).not.toBe(undefined);
                objects.push(object);
            }, () => {
                fail();
            }, () => {
                expect(objects[0]['resource']['id']).toEqual("1");
                expect(objects[0]['resource']['type']).toEqual("context");
                expect(objects[0]['id']).toEqual("1");
                expect(objects[1]['resource'].title).toEqual("Two");
                expect(objects.length).toEqual(2);
                done();
            });

        });

        it('should abort on syntax errors in file content', (done) => {

            var fileContent  = 'Identifier_uuid,Identifier,Title,Type\n'
                + '1,one,One,context\n'
                + ',two,Two,context\n';
            
            var parser = new IdigCsvParser();
            var objects = [];
            parser.parse(fileContent).subscribe(object => {
                expect(object).not.toBe(undefined);
                objects.push(object);
            }, (error) => {
                
                expect(objects.length).toEqual(1);
                expect(objects[0]['resource']['id']).toEqual("1");
                expect(error).toEqual(jasmine.any(SyntaxError));
                expect(error.message).toEqual(M.IMPORTER_FAILURE_MANDATORYCSVFIELDMISSING);
                expect(error.lineNumber).toEqual(2);
                done();
            });

        });

    });
}