import {Document} from 'idai-components-2/core';

/**
 * @author Thomas Kleinke
 */
xdescribe('ChangeHistoryUtil', () => { // TODO incorporate into remote changes stream tests

    let document1Revision1: Document;
    let document1Revision2: Document;
    let document1Revision3: Document;
    let document2Revision1: Document;
    let document2Revision2: Document;

    /**
    beforeEach(() => {

        document1Revision1 = {
            resource: {
                id: 'id1',
                type: 'Object',
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
            resource: {
                id: 'id1',
                type: 'Object',
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
            resource: {
                id: 'id1',
                type: 'Object',
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
            resource: {
                id: 'id2',
                type: 'Object',
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
            resource: {
                id: 'id2',
                type: 'Object',
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



    it('detect remote change', () => {

        expect(ChangeHistory.isRemoteChange(document1Revision1, [], 'user1'))
            .toBe(false);
        expect(ChangeHistory.isRemoteChange(document1Revision1, [], 'user2'))
            .toBe(true);
    });


    it('detect remote change for conflicted document', () => {

        expect(ChangeHistory.isRemoteChange(document1Revision1,
            [document1Revision2, document1Revision3],
            'user1')).toBe(true);
        expect(ChangeHistory.isRemoteChange(document1Revision1,
            [document1Revision2, document1Revision3],
            'user2')).toBe(false);
        expect(ChangeHistory.isRemoteChange(document1Revision1,
            [document1Revision2, document1Revision3],
            'user3')).toBe(true);
    });*/
});