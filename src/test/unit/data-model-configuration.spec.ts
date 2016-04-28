import {fdescribe, describe, expect, fit, it, xit, inject, beforeEach, beforeEachProviders} from 'angular2/testing';
import {DataModelConfiguration} from "../../main/app/services/data-model-configuration";
import {Messages} from "../../main/app/services/messages";
import {MessagesDictionary} from "../../main/app/services/messages-dictionary";

/**
 * @author Daniel de Oliveira
 */
export function main() {
    describe('DataModelConfiguration', () => {

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

                var dmc = new DataModelConfiguration(data);

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

                expect(function(){new DataModelConfiguration(data)}).toThrow(MessagesDictionary.MSGKEY_DMC_GENERIC_ERROR)
            }
        );
    });
}