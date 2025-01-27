import { nop } from 'tsfun';
import { MDInternal } from '../../../../src/app/components/messages/md-internal';
import { MessageTemplate } from '../../../../src/app/components/messages/message';
import { Messages } from '../../../../src/app/components/messages/messages';
import { MsgWithParams } from '../../../../src/app/components/messages/msg-with-params';


/**
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
describe('Messages', () => {

    let messages: Messages;

    const messagesDictionary = {
        msgs: {
            'key1' : {
                content: 'content1',
                level: 'danger'
            },
            'key2' : {
                content: 'content2',
                level: 'danger'
            }
        }
    };

    
    const verifyUnknownError = (consoleError) => {
    
        expect(messages.getActiveMessages()[1].content).toEqual(
            (new MDInternal().msgs[MDInternal.MESSAGES_ERROR_UNKNOWN_MESSAGE]).content
        );
        expect(console.error).toHaveBeenCalledWith(consoleError);
    };


    beforeAll(() => {

        jest.spyOn(console, 'error').mockImplementation(nop);
    });


    beforeEach(() => {

        messages = new Messages(messagesDictionary, 100);
        messages.add(['key1']);
    });


    afterEach(() => {

        (console.error as any).mockClear();
    });


    afterAll(() => {

        (console.error as any).mockRestore();
    });


    test('should store, retrieve and delete a message', () => {

        expect(messages.getActiveMessages()[0]).toEqual({
            content: 'content1',
            level: 'danger',
            params: [],
            hidden: false
        });
        messages.removeAllMessages();
        expect(messages.getActiveMessages()[0]).toBe(undefined);
    });


    test('should add message with same identifier twice', () => {

        messages.add(['key1']);
        expect(messages.getActiveMessages()[0]).toEqual({
            content: 'content1',
            level: 'danger',
            params: [],
            hidden: false
        });
        expect(messages.getActiveMessages().length).toBe(2);
    });


    test('should add two messages with different identifiers', () => {

        messages.add(['key2']);
        expect(messages.getActiveMessages()[0]).toEqual({
            content: 'content1',
            level: 'danger',
            params: [],
            hidden: false
        });
        expect(messages.getActiveMessages()[1]).toEqual({
            content: 'content2',
            level: 'danger',
            params: [],
            hidden: false
        });
        expect(messages.getActiveMessages().length).toBe(2);
    });


    test('should return always the same instance', () => {

        expect(messages.getActiveMessages() === messages.getActiveMessages()).toBeTruthy();
    });


    test('should clear all messages', () => {

        messages.removeAllMessages();
        expect(messages.getActiveMessages().length).toBe(0);
    });


    test('should show a msg from the internal message dictionary', () => {

        const template: MessageTemplate = new MDInternal().msgs[MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC];

        messages.add([MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC]);
        expect(messages.getActiveMessages()[1]).toEqual({
            content: template.content,
            level: template.level,
            params: [],
            hidden: false
        });
    });


    test('should override a msg from the internal message dictionary with the provided one', () => {

        messagesDictionary.msgs[MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC] = {
            content: 'test',
            level: 'danger'
        };
        messages.add([MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC]);
        expect(messages.getActiveMessages()[1]).toEqual({
            content: 'test',
            level: 'danger',
            params: [],
            hidden: false
        });
    });


    test('should add a message with parameters', () => {

        let params = ['param1','param2'];
        messages.add(['key2'].concat(params) as MsgWithParams);
        expect(messages.getActiveMessages()[1].params).toEqual(params);
    });


    test('should throw an error if adding a message with parameters but id not found', () => {

        messages.add(['nonexisting']);
        verifyUnknownError('No message template found for key: "nonexisting"');
    });


    test('should throw an error if array is empty', () => {

        messages.add([] as unknown as MsgWithParams);
        verifyUnknownError('No message template found for key: "undefined"');
    });
});
