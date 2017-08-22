import {ChangeHistoryUtil} from '../../../app/util/change-history-util';

/**
 * @author Thomas Kleinke
 */
export function main() {

    describe('ChangeHistoryUtil', () => {

        const document1: any = {
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

        const document2: any = {
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

        const document3: any = {
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

        const document4: any = {
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
    });
}