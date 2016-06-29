import {fdescribe,xdescribe,describe,expect,fit,it,xit, inject,beforeEach, beforeEachProviders} from '@angular/core/testing';
import {ObjectReader} from "../app/services/object-reader";

/**
 * @author Sebastian Cuy
 */
export function main() {

    describe('Importer', () => {

        it('should create objects from file', (done) => {

            var file  = new File([
                '{ "id": "/object/id1", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
                + '{ "id": "/object/id2", "identifier" : "ob2", "title": "Obi-Two Kenobi"}\n'
                + '{ "id": "/object/id3", "identifier" : "ob3", "title": "Obi-Three Kenobi"}'
            ], 'test.json', { type: "application/json" });

            var reader = new ObjectReader();
            reader.setChunkSize(1);
            var objects = [];
            reader.fromFile(file).subscribe( object => {
                expect(object).not.toBe(undefined);
                objects.push(object);
            }, () => {
                fail();
            }, () => {
                expect(objects[0]['resource']['@id']).toEqual("/object/id1");
                expect(objects[0]['resource']['type']).toEqual("object");
                expect(objects[0]['id']).toEqual("id1");
                expect(objects[2]['resource'].title).toEqual("Obi-Three Kenobi");
                expect(objects.length).toEqual(3);
                done();
            });

        });

        it('should abort on syntax errors in file', (done) => {

            var file  = new File([
                '{ "id": "/object/id1", "identifier" : "ob1", "title": "Obi-Wan Kenobi"}\n'
                + '{ "id": "/object/id2", "identifier" : "ob2", "title": "Obi-Two Kenobi"\n'
                + '{ "id": "/object/id3", "identifier" : "ob3", "title": "Obi-Three Kenobi"}'
            ], 'test.json', { type: "application/json" });

            var reader = new ObjectReader();
            var objects = [];
            reader.fromFile(file).subscribe( object => {
                expect(object).not.toBe(undefined);
                objects.push(object);
            }, (error) => {
                expect(objects.length).toEqual(1);
                expect(objects[0]['resource']['@id']).toEqual("/object/id1");
                expect(error).toEqual(jasmine.any(SyntaxError));
                expect(error.message).toContain('Unexpected end of');
                expect(error.lineNumber).toEqual(2);
                expect(error.fileName).toEqual('test.json');
                done();
            });

        });

    });
}