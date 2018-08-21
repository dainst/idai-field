import {Messages} from "../../../../src/core/messages/messages";
import {MDInternal} from "../../../../src/core/messages/md-internal";

/**
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */

let messagesDictionary = {
    msgs: {
        "key1" : {
            content: 'content1',
            level: 'danger',
            params: new Array(),
            hidden: false
        },
        "key2" : {
            content: 'content2',
            level: 'danger',
            params: new Array(),
            hidden: false
        }
    }
};

function verifyUnknownError(consoleError) {
    expect(messages.getActiveMessages()[1].content).toEqual((new MDInternal().msgs[MDInternal.UNKOWN_ERROR]).content);
    expect(console.error).toHaveBeenCalledWith(consoleError);
}

let messages: Messages;

beforeEach(
    function(){
        spyOn(console, 'error');
        messages = new Messages(messagesDictionary, 100);
        messages.add(["key1"]);
    }
);

describe('Messages', () => {


    it('should store, retrieve and delete a message',
        function(){
            expect(messages.getActiveMessages()[0]).toEqual(messagesDictionary.msgs["key1"]);
            messages.removeAllMessages();
            expect(messages.getActiveMessages()[0]).toBe(undefined);
        }
    );

    it('should add message with same identifier twice',
        function(){
            messages.add(["key1"]);
            expect(messages.getActiveMessages()[0]).toEqual(messagesDictionary.msgs["key1"]);
            expect(messages.getActiveMessages().length).toBe(2);
        }
    );

    it('should add two messages with different identifiers',
        function(){
            messages.add(["key2"]);
            expect(messages.getActiveMessages()[0]).toEqual(messagesDictionary.msgs["key1"]);
            expect(messages.getActiveMessages()[1]).toEqual(messagesDictionary.msgs["key2"]);
            expect(messages.getActiveMessages().length).toBe(2);
        }
    );


    it('should return always the same instance',
        function(){
            expect(messages.getActiveMessages()==messages.getActiveMessages()).toBeTruthy();
        }
    );

    it('should clear all messages',
        function(){
            messages.removeAllMessages();
            expect(messages.getActiveMessages().length).toBe(0);
        }
    );

    it('should show a msg from the internal message dictionary',
        function(){
            messages.add([MDInternal.MESSAGES_NOBODY]);
            expect(messages.getActiveMessages()[1]).toEqual((new MDInternal()).msgs[MDInternal.MESSAGES_NOBODY]);
        }
    );

    it('should override a msg from the internal message dictionary with the provided one',
        function(){
            messagesDictionary.msgs[MDInternal.MESSAGES_NOBODY]={
                content: 'test',
                level: 'danger',
                params: new Array(),
                hidden: false
            };
            messages.add([MDInternal.MESSAGES_NOBODY]);
            expect(messages.getActiveMessages()[1]).toEqual(messagesDictionary.msgs[MDInternal.MESSAGES_NOBODY]);
        }
    );

    it('should add a message with parameters',
        function(){
            let params = ['param1','param2'];
            messages.add(['key2'].concat(params));
            expect(messages.getActiveMessages()[1].params).toEqual(params);
        }
    );

    it('should throw an error if adding a message with parameters but id not found',
        function(){
            messages.add(['nonexisting']);
            verifyUnknownError('no msg found for key of M with id: "nonexisting"');
        }
    );

    it('should throw an error if array is empty',
        function(){
            messages.add([]);
            verifyUnknownError('no msg found for key of M with id: "undefined"');
        }
    );
});
