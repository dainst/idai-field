import {describe,expect,it,xit, inject, beforeEachProviders} from 'angular2/testing';
import {provide} from "angular2/core";
import {IdaiFieldObject} from "../app/model/idai-field-object";
import {ObjectList} from "../app/services/object-list";
import {Datastore} from "../app/services/datastore";
import {Messages} from "../app/services/messages";


/**
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 */
export function main() {
    describe('Messages ', () => {

        it('should store, retrieve and delete a message',
            function(){

                var messages = new Messages();
                messages.add("myId","hallo","warn");
                expect(messages.getMessages()[0].content).toBe("hallo");
                messages.delete("myId");
                expect(messages.getMessages()[0]).toBe(undefined);
            }
        );

        it('add two messages with the same identifier',
            function(){

                var messages = new Messages();
                messages.add("myId","hallo","warn");
                messages.add("myId","hallo","warn");
                expect(messages.getMessages()[0].content).toBe("hallo");
                expect(messages.getMessages().length).toBe(1);
            }
        );

        it('add two messages with different identifiers',
            function(){

                var messages = new Messages();
                messages.add("myId","hallo","warn");
                messages.add("myId2","hallo2","warn");
                expect(messages.getMessages()[0].content).toBe("hallo");
                expect(messages.getMessages()[1].content).toBe("hallo2");
                expect(messages.getMessages().length).toBe(2);
            }
        );

    })
}