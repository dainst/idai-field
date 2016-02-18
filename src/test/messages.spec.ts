import {describe,expect,it,xit, inject, beforeEachProviders} from 'angular2/testing';
import {provide} from "angular2/core";
import {IdaiFieldObject} from "../app/model/idai-field-object";
import {ObjectList} from "../app/services/object-list";
import {Datastore} from "../app/services/datastore";
import {Messages} from "../app/services/messages";


/**
 * @author Daniel M. de Oliveira
 */
export function main() {
    describe('Messages ', () => {

        it('should store, retrieve and delete a message',
            function(){

                var messages = new Messages();
                messages.add("myId","hallo","warn");
                expect(messages.getMessages()["myId"].content).toBe("hallo");
                messages.delete("myId");
                expect(messages.getMessages()["myId"]).toBe(undefined);
            }
        );
    })
}