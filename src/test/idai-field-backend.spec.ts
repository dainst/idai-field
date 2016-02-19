import {fdescribe,describe,expect,fit,it,xit, inject,beforeEach, beforeEachProviders} from 'angular2/testing';
import {provide} from "angular2/core";
import {IdaiFieldObject} from "../app/model/idai-field-object";
import {ObjectList} from "../app/services/object-list";
import {Datastore} from "../app/services/datastore";
import {Messages} from "../app/services/messages";
import {IdaiFieldBackend} from "../app/services/idai-field-backend";
import {Observable} from "../../node_modules/rxjs/Observable";


/**
 * @author Daniel M. de Oliveira
 */
export function main() {
    describe('IdaiFieldBackend', () => {

        var config = {
            backend : {
                uri : "uri"
            }
        };

        var successFunction = function() {
            return {
                subscribe: function(suc,err) {
                    suc("ok");
                }
            };
        };

        var failFunction = function() {
            return {
                subscribe: function(suc,err) {
                    err("fail");
                }
            };
        };

        var mockHttp;
        var idaiFieldBackend : IdaiFieldBackend;
        var j;

        beforeEach(function(){
            mockHttp   = jasmine.createSpyObj('mockHttp', [ 'get' ]);
            mockHttp.get.and.callFake(successFunction);

            idaiFieldBackend =
                new IdaiFieldBackend(mockHttp,config);
            j=0;
        });

        it('report it is connected',
            function(){

                idaiFieldBackend.isConnected().subscribe(connected => {
                    if (j==1) expect(connected).toBeTruthy();
                    j++;
                });

                mockHttp.get.and.callFake(failFunction);
                idaiFieldBackend.checkConnection();
                mockHttp.get.and.callFake(successFunction);
                idaiFieldBackend.checkConnection();

                expect(j).toBe(2);
            }
        );

        it('should report is not connected',
            function(){

                idaiFieldBackend.isConnected().subscribe(connected => {
                    if (j==0) expect(connected).toBeFalsy();
                    j++;
                });

                mockHttp.get.and.callFake(failFunction);
                idaiFieldBackend.checkConnection();

                expect(j).toBe(1);
            }
        );
    })
}