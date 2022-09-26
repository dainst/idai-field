import { MDInternal } from '../../../../src/app/components/messages/md-internal';
import { Messages } from '../../../../src/app/components/messages/messages';
import { MsgWithParams } from '../../../../src/app/components/messages/msg-with-params';


/**
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */


let messagesDictionary = {
    msgs: {
        'key1' : {
            content: 'content1',
            level: 'danger',
            params: [],
            hidden: false
        },
        'key2' : {
            content: 'content2',
            level: 'danger',
            params: [],
            hidden: false
        }
    }
};

let messages: Messages;


const verifyUnknownError = (consoleError) => {

    expect(messages.getActiveMessages()[1].content).toEqual(
        (new MDInternal().msgs[MDInternal.MESSAGES_ERROR_UNKNOWN_MESSAGE]).content
    );
    expect(console.error).toHaveBeenCalledWith(consoleError);
};



describe('Messages', () => {

    beforeEach(() => {

        spyOn(console, 'error');
        messages = new Messages(messagesDictionary, 100);
        messages.add(['key1']);
    });

    it('should store, retrieve and delete a message', () => {

        expect(messages.getActiveMessages()[0]).toEqual(messagesDictionary.msgs['key1']);
        messages.removeAllMessages();
        expect(messages.getActiveMessages()[0]).toBe(undefined);
    });


    it('should add message with same identifier twice', () => {

        messages.add(['key1']);
        expect(messages.getActiveMessages()[0]).toEqual(messagesDictionary.msgs['key1']);
        expect(messages.getActiveMessages().length).toBe(2);
    });


    it('should add two messages with different identifiers', () => {

        messages.add(['key2']);
        expect(messages.getActiveMessages()[0]).toEqual(messagesDictionary.msgs['key1']);
        expect(messages.getActiveMessages()[1]).toEqual(messagesDictionary.msgs['key2']);
        expect(messages.getActiveMessages().length).toBe(2);
    });


    it('should return always the same instance', () => {

        expect(messages.getActiveMessages() === messages.getActiveMessages()).toBeTruthy();
    });


    it('should clear all messages', () => {

        messages.removeAllMessages();
        expect(messages.getActiveMessages().length).toBe(0);
    });


    it('should show a msg from the internal message dictionary', () => {

        messages.add([MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC]);
        expect(messages.getActiveMessages()[1]).toEqual((new MDInternal()).msgs[MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC]);
    });


    it('should override a msg from the internal message dictionary with the provided one', () => {

        messagesDictionary.msgs[MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC]={
            content: 'test',
            level: 'danger',
            params: [],
            hidden: false
        };
        messages.add([MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC]);
        expect(messages.getActiveMessages()[1]).toEqual(messagesDictionary.msgs[MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC]);
    });

    it('should add a message with parameters', () => {

        let params = ['param1','param2'];
        messages.add(['key2'].concat(params) as MsgWithParams);
        expect(messages.getActiveMessages()[1].params).toEqual(params);
    });


    it('should throw an error if adding a message with parameters but id not found', () => {

        messages.add(['nonexisting']);
        verifyUnknownError('no msg found for key of M with id: "nonexisting"');
    });


    it('should throw an error if array is empty', () => {

        messages.add([] as unknown as MsgWithParams);
        verifyUnknownError('no msg found for key of M with id: "undefined"');
    });
});
