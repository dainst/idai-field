import {NewDocument} from 'idai-components-2';
import {DuplicationUtil} from '../../../../app/components/docedit/duplication-util';


/**
 * @author Thomas Kleinke
 */

describe('DuplicationUtil', () => {

    let validator;
    let identifiers = [];


    beforeAll(() => {

        validator = jasmine.createSpyObj('validator', ['assertIdentifierIsUnique']);
        validator.assertIdentifierIsUnique.and.callFake(async (document: NewDocument) => {
            if (identifiers.includes(document.resource.identifier)) throw 'duplicate identifier';
        });
    });


    it('split identifiers', () => {

       expect(DuplicationUtil.splitIdentifier('test1'))
           .toEqual({ baseIdentifier: 'test', identifierNumber: 1 });

        expect(DuplicationUtil.splitIdentifier('test123'))
            .toEqual({ baseIdentifier: 'test', identifierNumber: 123 });

        expect(DuplicationUtil.splitIdentifier('test123-456'))
            .toEqual({ baseIdentifier: 'test123-', identifierNumber: 456 });

        expect(DuplicationUtil.splitIdentifier('test'))
            .toEqual({ baseIdentifier: 'test', identifierNumber: 1 });

        expect(DuplicationUtil.splitIdentifier('123'))
            .toEqual({ baseIdentifier: '', identifierNumber: 123 });
    });


    it('set unique identifier', async () => {

        identifiers = ['test1', 'test2', 'test3'];
        const document: NewDocument = { resource: { identifier: 'test1', relations: {}, type: 'Find' } };

        await DuplicationUtil.setUniqueIdentifierForDuplicate(
            document, 'test', 1, validator
        );

        expect(document.resource.identifier).toEqual('test4');
    });

});