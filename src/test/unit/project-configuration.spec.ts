import {fdescribe, describe, expect, fit, it, xit, inject, beforeEach, beforeEachProviders} from 'angular2/testing';
import {ProjectConfiguration} from "../../main/app/model/project-configuration";
import {Messages} from "../../main/app/services/messages";
import {M} from "../../main/app/m";

/**
 * @author Daniel de Oliveira
 */
export function main() {
    describe('ProjectConfiguration', () => {

        it('should let types inherit fields from parent types',
            function() {

                var data={"types":[
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
                ]};

                var dmc = new ProjectConfiguration(data);

                var fields=dmc.getFields('SecondLevelType');
                expect(fields[0].field).toBe('fieldA');
                expect(fields[1].field).toBe('fieldB');
            }
        );


        it('should fail if parent type is referenced but not defined before',
            function() {

                var data={"types":[
                    {
                        "type": "SecondLevelType",
                        "parent" : "FirstLevelType",
                        "fields": [
                            {
                                "field": "fieldB"
                            }
                        ]
                    },
                    {
                        "type": "FirstLevelType",
                        "fields": [
                            {
                                "field": "fieldA"
                            }
                        ]
                    }
                ]};

                expect(function(){new ProjectConfiguration(data)}).toThrow(M.PC_GENERIC_ERROR)
            }
        );
    });
}