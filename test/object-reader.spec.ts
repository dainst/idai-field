import {fdescribe,describe,expect,fit,it,xit, inject,beforeEach, beforeEachProviders} from '@angular/core/testing';
import {provide} from "@angular/core";
import {ObjectReader} from "../app/services/object-reader";

/**
 * @author Sebastian Cuy
 */
export function main() {

    describe('Importer', () => {

        it('should create objects from file', (done) => {

            var file  = new File([
                '{ "id": "ob1", "title": "Obi-Wan Kenobi"}\n'
                + '{ "id": "ob2", "title": "Obi-Two Kenobi"}\n'
                + '{ "id": "ob3", "title": "Obi-Three Kenobi"}'
            ], 'test.json', { type: "application/json" });

            var reader = new ObjectReader(1);
            var objects = [];
            reader.fromFile(file).subscribe( object => {
                expect(object).not.toBe(undefined);
                objects.push(object);
            }, () => {
                fail();
            }, () => {
                expect(objects[0].id).toEqual("ob1");
                expect(objects[2].title).toEqual("Obi-Three Kenobi");
                expect(objects.length).toEqual(3);
                done();
            });

        });

        it('should abort on syntax errors in file', (done) => {

            var file  = new File([
                '{ "id": "ob1", "title": "Obi-Wan Kenobi"}\n'
                + '{ "id": "ob2", "title": "Obi-Two Kenobi"\n'
                + '{ "id": "ob3", "title": "Obi-Three Kenobi"}'
            ], 'test.json', { type: "application/json" });

            var reader = new ObjectReader();
            var objects = [];
            reader.fromFile(file).subscribe( object => {
                expect(object).not.toBe(undefined);
                objects.push(object);
            }, (error) => {
                expect(objects.length).toEqual(1);
                expect(objects[0].id).toEqual("ob1");
                expect(error.cause).toEqual(jasmine.any(SyntaxError));
                expect(error.cause.message).toContain('Unexpected end of');
                expect(error.line).toEqual(2);
                done();
            });

        });

    });
}