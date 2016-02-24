import {fdescribe,describe,expect,fit,it,xit, inject,beforeEach, beforeEachProviders} from 'angular2/testing';
import {provide} from "angular2/core";
import {IdaiFieldObject} from "../app/model/idai-field-object";
import {ModelUtils} from "../app/model/model-utils";

/**
 * @author Jan G. Wieners
 */
export function main() {
    describe('ModelUtils', () => {

        it('should clone an IdaiFieldObject with all of its properties if no filter properties are given',
            function(){

                var initialObject = {
                    "identifier": "ob1",
                    "title": "Title",
                    "synced": 0,
                    "valid": true,
                    "type": "Object"
                };
                var clonedObject = ModelUtils.filterUnwantedProps(initialObject);
                expect(clonedObject).toEqual(initialObject);
            }
        );

        it('should create a full copy of an IdaiFieldObject, not just a reference to the object',
            function(){

                var initialObject = {
                    "identifier": "ob1",
                    "title": "Title",
                    "synced": 0,
                    "valid": true,
                    "type": "Object"
                };
                var clonedObject = ModelUtils.filterUnwantedProps(initialObject);
                expect(clonedObject).not.toBe(initialObject);
            }
        );

        it('should create a clone of an IdaiFieldObject which lacks defined properties',
            function(){

                var initialObject = {
                    "identifier": "ob1",
                    "title": "Title",
                    "synced": 0,
                    "valid": true,
                    "type": "Object"
                };
                var clonedObject = ModelUtils.filterUnwantedProps(initialObject, ['title', 'synced', 'type']);

                var filteredObject = {
                    "identifier": "ob1",
                    "valid": true
                };
                expect(clonedObject).toEqual(filteredObject);
            }
        );
    })
}