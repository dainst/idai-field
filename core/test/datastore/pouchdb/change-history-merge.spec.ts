import { Document } from '../../../src/model/document/document';
import { ChangeHistoryMerge } from '../../../src/datastore/pouchdb/change-history-merge';

/**
 * @author Thomas Kleinke
 */
describe('ChangeHistoryMerge', () => {

    let document1Revision1: Document;
    let document1Revision2: Document;
    let document1Revision3: Document;
    let document2Revision1: Document;
    let document2Revision2: Document;


    beforeEach(() => {

        document1Revision1 = {
            _id: 'id1',
            resource: {
                id: 'id1',
                identifier: '',
                category: 'Object',
                relations: {}
            },
            created: {
                user: 'user1',
                date: new Date('2018-01-01T01:00:00.00Z')
            },
            modified: [
                {
                    user: 'user1',
                    date: new Date('2018-01-01T01:00:00.00Z')
                }, {
                    user: 'user1',
                    date: new Date('2018-01-02T07:00:00.00Z')
                }, {
                    user: 'user1',
                    date: new Date('2018-01-02T14:00:00.00Z')
                }
            ]
        };

        document1Revision2 = {
            _id: 'id1',
            resource: {
                id: 'id1',
                identifier: '',
                category: 'Object',
                relations: {}
            },
            created: {
                user: 'user1',
                date: new Date('2018-01-01T01:00:00.00Z')
            },
            modified: [
                {
                    user: 'user1',
                    date: new Date('2018-01-01T01:00:00.00Z')
                }, {
                    user: 'user1',
                    date: new Date('2018-01-02T07:00:00.00Z')
                }, {
                    user: 'user2',
                    date: new Date('2018-01-02T12:00:00.00Z')
                }, {
                    user: 'user2',
                    date: new Date('2018-01-02T15:00:00.00Z')
                }
            ]
        };

        document1Revision3 = {
            _id: 'id1',
            resource: {
                id: 'id1',
                identifier: '',
                category: 'Object',
                relations: {}
            },
            created: {
                user: 'user1',
                date: new Date('2018-01-01T01:00:00.00Z')
            },
            modified: [
                {
                    user: 'user1',
                    date: new Date('2018-01-01T01:00:00.00Z')
                }, {
                    user: 'user3',
                    date: new Date('2018-01-02T09:00:00.00Z')
                }
            ]
        };

        document2Revision1 = {
            _id: 'id2',
            resource: {
                id: 'id2',
                identifier: '',
                category: 'Object',
                relations: {}
            },
            created: {
                user: 'user1',
                date: new Date('2018-01-01T02:00:00.00Z')
            },
            modified: [
                {
                    user: 'user1',
                    date: new Date('2018-01-01T02:00:00.00Z')
                }
            ]
        };

        document2Revision2 = {
            _id: 'id2',
            resource: {
                id: 'id2',
                identifier: '',
                category: 'Object',
                relations: {}
            },
            created: {
                user: 'user2',
                date: new Date('2018-01-01T01:00:00.00Z')
            },
            modified: [
                {
                    user: 'user2',
                    date: new Date('2018-01-01T01:00:00.00Z')
                }
            ]
        };
    });


    it('merges two change histories', () => {

        ChangeHistoryMerge.mergeChangeHistories(document1Revision1, document1Revision2);

        expect(document1Revision1.created.user).toEqual('user1');
        expect(document1Revision1.created.date).toEqual(new Date('2018-01-01T01:00:00.00Z'));

        expect(document1Revision1.modified.length).toBe(4);
        expect(document1Revision1.modified[0].user).toEqual('user1');
        expect(document1Revision1.modified[0].date).toEqual(new Date('2018-01-02T07:00:00.00Z'));
        expect(document1Revision1.modified[1].user).toEqual('user2');
        expect(document1Revision1.modified[1].date).toEqual(new Date('2018-01-02T12:00:00.00Z'));
        expect(document1Revision1.modified[2].user).toEqual('user1');
        expect(document1Revision1.modified[2].date).toEqual(new Date('2018-01-02T14:00:00.00Z'));
        expect(document1Revision1.modified[3].user).toEqual('user2');
        expect(document1Revision1.modified[3].date).toEqual(new Date('2018-01-02T15:00:00.00Z'));
    });


    it('merges two change histories of separately created documents', () => {

        ChangeHistoryMerge.mergeChangeHistories(document2Revision1, document2Revision2);

        expect(document2Revision1.created.user).toEqual('user2');
        expect(document2Revision1.created.date).toEqual(new Date('2018-01-01T01:00:00.00Z'));

        expect(document2Revision1.modified.length).toBe(1);
        expect(document2Revision1.modified[0].user).toEqual('user1');
        expect(document2Revision1.modified[0].date).toEqual(new Date('2018-01-01T02:00:00.00Z'));
    });
});
