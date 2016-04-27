import {fdescribe, describe, expect, fit, it, xit, inject, beforeEach, beforeEachProviders} from 'angular2/testing';
import {DataModelConfiguration} from "../../main/app/services/data-model-configuration";
import {Messages} from "../../main/app/services/messages";

/**
 * @author Daniel de Oliveira
 */
export function main() {
    describe('DataModelConfiguration', () => {

        var http;
        var mockmsg;

        var prepareHttp = function(typesArray) {
            http.get.and.callFake(function(data) {
                return {
                    subscribe: function(suc) {
                        suc({"_body":
                            JSON.stringify({"types":typesArray})
                        });
                    }
                };
            });
        };

        beforeEach(()=>{
            mockmsg = jasmine.createSpyObj('messages', [ 'add' ]);
            http = jasmine.createSpyObj('http', [ 'get' ]);
        });

        it('should let types inherit fields from parent types',
            function(done) {

                prepareHttp([
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
                ]);

                DataModelConfiguration.createInstance(http,new Messages()).then((dmc)=> {
                    var fields=dmc.getFields('SecondLevelType');
                    expect(fields[0].field).toBe('fieldA');
                    expect(fields[1].field).toBe('fieldB');
                    done();
                });


            }
        );


        it('should fail if parent type is referenced but not defined before',
            function(done) {

                prepareHttp([
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
                ]);

                DataModelConfiguration.createInstance(http,mockmsg).then((dmc)=>{
                    expect(mockmsg.add).toHaveBeenCalled();
                    done();
                });
            }
        );
    });
}