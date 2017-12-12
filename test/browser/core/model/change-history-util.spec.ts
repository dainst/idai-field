import {ChangeHistoryUtil} from '../../../../app/core/model/change-history-util';

/**
 * @author Thomas Kleinke
 */
export function main() {

    describe('ChangeHistoryUtil', () => {

        let document1: any;
        let document1ConflictedRevision1: any;
        let document1ConflictedRevision2: any;
        let document2: any;
        let document3: any;
        let document4: any;


        beforeEach(() => {

            document1 = {
                resource: {
                    id: 'id1',
                    identifier: 'identifier1'
                },
                created: {
                    user: 'user1',
                    date: '2018-01-01T01:00:00.00Z'
                },
                modified: [
                    {
                        user: 'user1',
                        date: '2018-01-02T07:00:00.00Z'
                    }, {
                        user: 'user1',
                        date: '2018-01-02T14:00:00.00Z'
                    }
                ]
            };

            document1ConflictedRevision1 = {
                resource: {
                    id: 'id1',
                    identifier: 'identifier1'
                },
                created: {
                    user: 'user1',
                    date: '2018-01-01T01:00:00.00Z'
                },
                modified: [
                    {
                        user: 'user1',
                        date: '2018-01-02T07:00:00.00Z'
                    }, {
                        user: 'user1',
                        date: '2018-01-02T14:00:00.00Z'
                    }, {
                        user: 'user2',
                        date: '2018-01-03T21:00:00.00Z'
                    }
                ]
            };

            document1ConflictedRevision2 = {
                resource: {
                    id: 'id1',
                    identifier: 'identifier1'
                },
                created: {
                    user: 'user1',
                    date: '2018-01-01T01:00:00.00Z'
                },
                modified: [
                    {
                        user: 'user1',
                        date: '2018-01-02T07:00:00.00Z'
                    }, {
                        user: 'user1',
                        date: '2018-01-02T14:00:00.00Z'
                    }, {
                        user: 'user1',
                        date: '2018-01-03T14:00:00.00Z'
                    }
                ]
            };

            document2 = {
                resource: {
                    id: 'id2',
                    identifier: 'identifier2'
                },
                created: {
                    user: 'user1',
                    date: '2018-01-01T01:00:00.00Z'
                },
                modified: [
                    {
                        user: 'user1',
                        date: '2018-01-02T07:00:00.00Z'
                    }, {
                        user: 'user2',
                        date: '2018-01-02T12:00:00.00Z'
                    }, {
                        user: 'user2',
                        date: '2018-01-02T15:00:00.00Z'
                    }
                ]
            };

            document3 = {
                resource: {
                    id: 'id3',
                    identifier: 'identifier3'
                },
                created: {
                    user: 'user1',
                    date: '2018-01-01T02:00:00.00Z'
                },
                modified: []
            };

            document4 = {
                resource: {
                    id: 'id4',
                    identifier: 'identifier4'
                },
                created: {
                    user: 'user2',
                    date: '2018-01-01T01:00:00.00Z'
                },
                modified: []
            };
        });


        it('merges two change histories', () => {

            ChangeHistoryUtil.mergeChangeHistories(document1, document2);

            expect(document1.created.user).toEqual('user1');
            expect(document1.created.date).toEqual('2018-01-01T01:00:00.00Z');

            expect(document1.modified.length).toBe(4);
            expect(document1.modified[0].user).toEqual('user1');
            expect(document1.modified[0].date).toEqual('2018-01-02T07:00:00.00Z');
            expect(document1.modified[1].user).toEqual('user2');
            expect(document1.modified[1].date).toEqual('2018-01-02T12:00:00.00Z');
            expect(document1.modified[2].user).toEqual('user1');
            expect(document1.modified[2].date).toEqual('2018-01-02T14:00:00.00Z');
            expect(document1.modified[3].user).toEqual('user2');
            expect(document1.modified[3].date).toEqual('2018-01-02T15:00:00.00Z');
        });


        it('merges two change histories of separately created documents', () => {

            ChangeHistoryUtil.mergeChangeHistories(document3, document4);

            expect(document3.created.user).toEqual('user2');
            expect(document3.created.date).toEqual('2018-01-01T01:00:00.00Z');

            expect(document3.modified.length).toBe(1);
            expect(document3.modified[0].user).toEqual('user1');
            expect(document3.modified[0].date).toEqual('2018-01-01T02:00:00.00Z');
        });


        it('detect remote change', () => {

            expect(ChangeHistoryUtil.isRemoteChange(document1, [], 'user1'))
                .toBe(false);
            expect(ChangeHistoryUtil.isRemoteChange(document1, [], 'user2'))
                .toBe(true);
        });


        it('detect remote change for conflicted document', () => {

            expect(ChangeHistoryUtil.isRemoteChange(document1,
                [document1ConflictedRevision1, document1ConflictedRevision2],
                'user1')).toBe(true);
            expect(ChangeHistoryUtil.isRemoteChange(document1,
                [document1ConflictedRevision1, document1ConflictedRevision2],
                'user2')).toBe(false);
        });
    });
}