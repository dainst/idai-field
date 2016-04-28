import {fdescribe,describe,expect,fit,it,xit, inject,beforeEach, beforeEachProviders} from 'angular2/testing';
import {provide} from "angular2/core";
import {IdaiFieldObject} from "../../main/app/model/idai-field-object";
import {ObjectList} from "../../main/app/services/object-list";
import {Datastore} from "../../main/app/datastore/datastore";
import {Messages} from "../../main/app/services/messages";
import {M} from "../../main/app/services/m";

/**
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 */
export function main() {
    describe('Messages', () => {

        var messagesDictionary : M
        var messages : Messages;

        beforeEach(
            function(){
                messagesDictionary = new M()
                messages = new Messages(messagesDictionary);
                messages.add(M.OBJLIST_IDEXISTS, "warning");
            });

        it('should store, retrieve and delete a message',
            function(){

                expect(messages.getMessages()[0].content).toBe(messagesDictionary.msgs[M.OBJLIST_IDEXISTS]);
                messages.delete(M.OBJLIST_IDEXISTS);
                expect(messages.getMessages()[0]).toBe(undefined);
            }
        );

        it('add two messages with the same identifier',
            function(){

                messages.add(M.OBJLIST_IDEXISTS,"warning");
                expect(messages.getMessages()[0].content).toBe(messagesDictionary.msgs[M.OBJLIST_IDEXISTS]);
                expect(messages.getMessages().length).toBe(1);
            }
        );

        it('add two messages with different identifiers',
            function(){

                messages.add(M.MESSAGES_NOBODY,"warning");
                expect(messages.getMessages()[0].content).toBe(messagesDictionary.msgs[M.OBJLIST_IDEXISTS]);
                expect(messages.getMessages()[1].content).toBe(messagesDictionary.msgs[M.MESSAGES_NOBODY]);
                expect(messages.getMessages().length).toBe(2);
            }
        );

        it('will not add a non existing message',
            function(){

                expect(function(){messages.add("notexisting", "warning");})
                    .toThrowErrorWith(messagesDictionary.msgs[M.MESSAGES_NOBODY].replace("id","notexisting"));
            }
        );

        it('will not throw error if trying to delete an already deleted message',
            function(){

                messages.delete(M.OBJLIST_IDEXISTS);
                expect(function(){messages.delete(M.OBJLIST_IDEXISTS);})
                    .not.toThrow();
            }
        );

        it('will return always the same instance',
            function(){

                expect(messages.getMessages()==messages.getMessages()).toBeTruthy();
            }
        );

        it('will clear all messages',
            function(){
                messages.clear();
                expect(messages.getMessages().length).toBe(0);
            }
        );

        it('will throw an error message if message level is invalid',
            function(){

                expect(function(){
                    messages.add(M.MESSAGES_NOBODY, "invalidlevel");
                }).toThrowErrorWith(M.MSG_WRONG_LEVEL.replace("msglevel", "invalidlevel"));
            }
        );
    })
}