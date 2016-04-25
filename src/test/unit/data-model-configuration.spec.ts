import {fdescribe, describe, expect, fit, it, xit, inject, beforeEach, beforeEachProviders} from 'angular2/testing';
import {DataModelConfiguration} from "../../main/app/services/data-model-configuration";

/**
 * @author Daniel de Oliveira
 */
export function main() {
    describe('DataModelConfiguration', () => {

        it('should let types inherit fields from parent types',
            function() {
                
                var data = {
                    "types" : [
                        {
                            "type": "FirstLevelType",
                            "fields": [
                                {
                                    "field": "fieldA"
                                }
                            ]
                        },
                        {
                            "type": "SecondLevelType",
                            "parent" : "FirstLevelType",
                            "fields": [
                                {
                                    "field": "fieldB"
                                }
                            ]
                        }
                    ]
                };
                
                var dmc = new DataModelConfiguration(data);
                expect(dmc.getFields('FirstLevelType')[0].field).toBe('fieldA');
                expect(dmc.getFields('SecondLevelType')[0].field).toBe('fieldA');
                expect(dmc.getFields('SecondLevelType')[1].field).toBe('fieldB');
            }
        );
    });
}