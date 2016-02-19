import {fdescribe,describe,expect,fit,it,xit, inject,beforeEach, beforeEachProviders} from 'angular2/testing';
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
    describe('Messages', () => {

        var id = "objectlist/idexists";
        var messages : Messages;

        beforeEach(
            function(){
                messages = new Messages();
                messages.add(id,"warn");
        });

        it('should store, retrieve and delete a message',
            function(){

                expect(messages.getMessages()[0].content).toBe(Messages.MESSAGES[id]);
                messages.delete(id);
                expect(messages.getMessages()[0]).toBe(undefined);
            }
        );

        it('add two messages with the same identifier',
            function(){

                messages.add(id,"warn");
                expect(messages.getMessages()[0].content).toBe(Messages.MESSAGES[id]);
                expect(messages.getMessages().length).toBe(1);
            }
        );

        it('add two messages with different identifiers',
            function(){

                messages.add("temp","warn");
                expect(messages.getMessages()[0].content).toBe(Messages.MESSAGES[id]);
                expect(messages.getMessages()[1].content).toBe(Messages.MESSAGES["temp"]);
                expect(messages.getMessages().length).toBe(2);
            }
        );

        it('will not add a non existing message',
            function(){

                try {
                    messages.add("notexisting", "warn");
                    fail();
                } catch (expected) {}
            }
        );

        it('will not throw error if trying to delete an already deleted message',
            function(){

                messages.delete(id);
                try {
                    messages.delete(id);
                } catch (notexpected) {
                    fail(notexpected);
                }
            }
        );
    })
}