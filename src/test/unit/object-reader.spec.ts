import {fdescribe,describe,expect,fit,it,xit, inject,beforeEach, beforeEachProviders} from 'angular2/testing';
import {provide} from "angular2/core";
import {ObjectReader} from "../../main/app/services/object-reader";

/**
 * @author Sebastian Cuy
 */
export function main() {

    describe('Importer', () => {

        var reader: ObjectReader;
        var file: File;

        beforeEach( () => {
            reader = new ObjectReader();
            file  = new File([
                '{ "id": "ob1", "title": "Obi-Wan Kenobi"}\n'
                + '{ "id": "ob2", "title": "Obi-Two Kenobi"}\n'
            ], 'test.json', { type: "application/json" });
        });

        it('should create objects from file', (done) => {
            reader.fromFile(file).subscribe( object => {
                console.log('read object', object);
                expect(object).not.toBe(undefined);
            }, () => {
                fail();
            }, () => {
                console.log('done reading objects');
                done();
            });
        });

    });
}