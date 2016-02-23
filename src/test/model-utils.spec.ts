import {fdescribe,describe,expect,fit,it,xit, inject,beforeEach, beforeEachProviders} from 'angular2/testing';
import {provide} from "angular2/core";
import {IdaiFieldObject} from "../app/model/idai-field-object";
import {ModelUtils} from "../app/model/model-utils";

/**
 * @author Jan G. Wieners
 */
export function main() {
    describe('ModelUtils', () => {

        fit('should clone an IdaiFieldObject with all of its properties',
            function(){

                var initialObject = {
                    "identifier": "ob1",
                    "title": "Title",
                    "synced": 0,
                    "valid": true,
                    "type": "Object"
                };
                var clonedObject = ModelUtils.clone(initialObject);

                //clonedObject.identifier = "obNew"; // make test fail
                expect(clonedObject).toEqual(initialObject);
            }
        );
    })
}