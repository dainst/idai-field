import { BackupsInfo } from '../../../../../src/app/services/backup/model/backups-info';
import { KeepBackupsSettings } from '../../../../../src/app/services/settings/keep-backups-settings';
import { getBackupsToDelete } from '../../../../../src/app/services/backup/auto-backup/get-backups-to-delete';
import { Backup } from '../../../../../src/app/services/backup/model/backup';


/**
 * @author Thomas Kleinke
 */
describe('get backups to delete', () => {

    test('keep only latest backup', () => {

        const backupsInfo: BackupsInfo = {
            backups: { 
                'project': [
                    {
                        fileName: 'file1.jsonl',
                        updateSequence: 1,
                        creationDate: new Date('2025-01-01T10:00:00+01:00')
                    },
                    {
                        fileName: 'file2.jsonl',
                        updateSequence: 2,
                        creationDate: new Date('2025-01-02T10:00:00+01:00')
                    },
                    {
                        fileName: 'file3.jsonl',
                        updateSequence: 3,
                        creationDate: new Date('2025-01-02T11:00:00+01:00')
                    }
                ]
            }
        };

        const settings: KeepBackupsSettings = {
            daily: 1,
            weekly: 0,
            monthly: 0
        };

        const currentDate: Date = new Date('2025-01-02T12:00:00+01:00');

        const result: Array<Backup> = getBackupsToDelete(backupsInfo, settings, currentDate);
        expect(result.length).toBe(2);
        expect(result[0].fileName).toBe('file1.jsonl');
        expect(result[1].fileName).toBe('file2.jsonl');
    });


    test('keep only latest backup per day for the last three days', () => {

        const backupsInfo: BackupsInfo = {
            backups: { 
                'project': [
                    {
                        fileName: 'file1.jsonl',
                        updateSequence: 1,
                        creationDate: new Date('2025-01-01T10:00:00+01:00')
                    },
                    {
                        fileName: 'file2.jsonl',
                        updateSequence: 2,
                        creationDate: new Date('2025-01-02T11:00:00+01:00')
                    },
                    {
                        fileName: 'file3.jsonl',
                        updateSequence: 3,
                        creationDate: new Date('2025-01-02T23:00:00+01:00')
                    },
                    {
                        fileName: 'file4.jsonl',
                        updateSequence: 4,
                        creationDate: new Date('2025-01-03T00:00:00+01:00')
                    },
                    {
                        fileName: 'file5.jsonl',
                        updateSequence: 5,
                        creationDate: new Date('2025-01-03T01:00:00+01:00')
                    },
                    {
                        fileName: 'file6.jsonl',
                        updateSequence: 6,
                        creationDate: new Date('2025-01-04T11:00:00+01:00')
                    }
                ]
            }
        };

        const settings: KeepBackupsSettings = {
            daily: 3,
            weekly: 0,
            monthly: 0
        };

        const currentDate: Date = new Date('2025-01-04T12:00:00+01:00');

        const result: Array<Backup> = getBackupsToDelete(backupsInfo, settings, currentDate);
        expect(result.length).toBe(3);
        expect(result[0].fileName).toBe('file1.jsonl');
        expect(result[1].fileName).toBe('file2.jsonl');
        expect(result[2].fileName).toBe('file4.jsonl');
    });


    test('keep one daily and one weekly backup', () => {

        const backupsInfo: BackupsInfo = {
            backups: { 
                'project': [
                    {
                        fileName: 'file1.jsonl',
                        updateSequence: 1,
                        creationDate: new Date('2025-01-01T10:00:00+01:00')
                    },
                    {
                        fileName: 'file2.jsonl',
                        updateSequence: 2,
                        creationDate: new Date('2025-01-09T10:00:00+01:00')
                    },
                    {
                        fileName: 'file3.jsonl',
                        updateSequence: 3,
                        creationDate: new Date('2025-01-17T10:00:00+01:00')
                    },
                    {
                        fileName: 'file4.jsonl',
                        updateSequence: 4,
                        creationDate: new Date('2025-01-18T10:00:00+01:00')
                    },
                    {
                        fileName: 'file5.jsonl',
                        updateSequence: 5,
                        creationDate: new Date('2025-01-19T10:00:00+01:00')
                    }
                ]
            }
        };

        const settings: KeepBackupsSettings = {
            daily: 1,
            weekly: 1,
            monthly: 0
        };

        const currentDate: Date = new Date('2025-01-19T10:00:00+01:00');

        const result: Array<Backup> = getBackupsToDelete(backupsInfo, settings, currentDate);
        expect(result.length).toBe(3);
        expect(result[0].fileName).toBe('file1.jsonl');
        expect(result[1].fileName).toBe('file2.jsonl');
        expect(result[2].fileName).toBe('file4.jsonl');
    });


    test('keep one daily, one weekly and one monthly backup', () => {

        const backupsInfo: BackupsInfo = {
            backups: { 
                'project': [
                    {
                        fileName: 'file1.jsonl',
                        updateSequence: 1,
                        creationDate: new Date('2024-12-15T10:00:00+01:00')
                    },
                    {
                        fileName: 'file2.jsonl',
                        updateSequence: 2,
                        creationDate: new Date('2025-01-01T10:00:00+01:00')
                    },
                    {
                        fileName: 'file3.jsonl',
                        updateSequence: 3,
                        creationDate: new Date('2025-01-09T10:00:00+01:00')
                    },
                    {
                        fileName: 'file4.jsonl',
                        updateSequence: 4,
                        creationDate: new Date('2025-01-17T10:00:00+01:00')
                    },
                    {
                        fileName: 'file5.jsonl',
                        updateSequence: 5,
                        creationDate: new Date('2025-01-18T10:00:00+01:00')
                    },
                    {
                        fileName: 'file6.jsonl',
                        updateSequence: 6,
                        creationDate: new Date('2025-01-19T10:00:00+01:00')
                    }
                ]
            }
        };

        const settings: KeepBackupsSettings = {
            daily: 1,
            weekly: 1,
            monthly: 1
        };

        const currentDate: Date = new Date('2025-01-19T10:00:00+01:00');

        const result: Array<Backup> = getBackupsToDelete(backupsInfo, settings, currentDate);
        expect(result.length).toBe(3);
        expect(result[0].fileName).toBe('file1.jsonl');
        expect(result[1].fileName).toBe('file3.jsonl');
        expect(result[2].fileName).toBe('file5.jsonl');
    });


    test('keep three daily, three weekly and three monthly backups', () => {

        const backupsInfo: BackupsInfo = {
            backups: { 
                'project': [
                    {
                        fileName: 'file1.jsonl',
                        updateSequence: 1,
                        creationDate: new Date('2024-10-15T10:00:00+01:00')
                    },
                    {
                        fileName: 'file2.jsonl',
                        updateSequence: 2,
                        creationDate: new Date('2024-11-15T10:00:00+01:00')
                    },
                    {
                        fileName: 'file3.jsonl',
                        updateSequence: 3,
                        creationDate: new Date('2024-11-16T10:00:00+01:00')
                    },
                    {
                        fileName: 'file4.jsonl',
                        updateSequence: 4,
                        creationDate: new Date('2024-12-15T10:00:00+01:00')
                    },
                    {
                        fileName: 'file5.jsonl',
                        updateSequence: 5,
                        creationDate: new Date('2025-01-01T10:00:00+01:00')
                    },
                    {
                        fileName: 'file6.jsonl',
                        updateSequence: 6,
                        creationDate: new Date('2025-01-08T10:00:00+01:00')
                    },
                    {
                        fileName: 'file7.jsonl',
                        updateSequence: 7,
                        creationDate: new Date('2025-01-17T10:00:00+01:00')
                    },
                    {
                        fileName: 'file8.jsonl',
                        updateSequence: 8,
                        creationDate: new Date('2025-01-21T10:00:00+01:00')
                    },
                    {
                        fileName: 'file9.jsonl',
                        updateSequence: 9,
                        creationDate: new Date('2025-01-28T10:00:00+01:00')
                    },
                    {
                        fileName: 'file10.jsonl',
                        updateSequence: 10,
                        creationDate: new Date('2025-01-28T11:00:00+01:00')
                    },
                    {
                        fileName: 'file11.jsonl',
                        updateSequence: 11,
                        creationDate: new Date('2025-01-29T10:00:00+01:00')
                    },
                    {
                        fileName: 'file12.jsonl',
                        updateSequence: 12,
                        creationDate: new Date('2025-01-30T10:00:00+01:00')
                    },
                    {
                        fileName: 'file13.jsonl',
                        updateSequence: 13,
                        creationDate: new Date('2025-01-31T10:00:00+01:00')
                    }
                ]
            }
        };

        const settings: KeepBackupsSettings = {
            daily: 3,
            weekly: 3,
            monthly: 3
        };

        const currentDate: Date = new Date('2025-01-31T10:00:00+01:00');

        const result: Array<Backup> = getBackupsToDelete(backupsInfo, settings, currentDate);
        expect(result.length).toBe(4);
        expect(result[0].fileName).toBe('file1.jsonl');
        expect(result[1].fileName).toBe('file3.jsonl');
        expect(result[2].fileName).toBe('file6.jsonl');
        expect(result[3].fileName).toBe('file10.jsonl');
    });


    test('do not keep daily backups if too old', () => {

        const backupsInfo: BackupsInfo = {
            backups: { 
                'project': [
                    {
                        fileName: 'file1.jsonl',
                        updateSequence: 1,
                        creationDate: new Date('2025-01-01T10:00:00+01:00')
                    },
                    {
                        fileName: 'file2.jsonl',
                        updateSequence: 2,
                        creationDate: new Date('2025-01-02T10:00:00+01:00')
                    },
                    {
                        fileName: 'file3.jsonl',
                        updateSequence: 3,
                        creationDate: new Date('2025-01-03T10:00:00+01:00')
                    },
                    {
                        fileName: 'file4.jsonl',
                        updateSequence: 4,
                        creationDate: new Date('2025-01-04T10:00:00+01:00')
                    }
                ]
            }
        };

        const settings: KeepBackupsSettings = {
            daily: 3,
            weekly: 0,
            monthly: 0
        };

        const currentDate: Date = new Date('2025-01-05T10:00:00+01:00');

        const result: Array<Backup> = getBackupsToDelete(backupsInfo, settings, currentDate);
        expect(result.length).toBe(2);
        expect(result[0].fileName).toBe('file1.jsonl');
        expect(result[1].fileName).toBe('file2.jsonl');
    });


    test('always keep latest backup even if it is too old', () => {

        const backupsInfo: BackupsInfo = {
            backups: { 
                'project': [
                    {
                        fileName: 'file1.jsonl',
                        updateSequence: 1,
                        creationDate: new Date('2025-01-01T10:00:00+01:00')
                    },
                    {
                        fileName: 'file2.jsonl',
                        updateSequence: 2,
                        creationDate: new Date('2025-01-02T10:00:00+01:00')
                    }
                ]
            }
        };

        const settings: KeepBackupsSettings = {
            daily: 1,
            weekly: 0,
            monthly: 0
        };

        const currentDate: Date = new Date('2025-02-01T10:00:00+01:00');

        const result: Array<Backup> = getBackupsToDelete(backupsInfo, settings, currentDate);
        expect(result.length).toBe(1);
        expect(result[0].fileName).toBe('file1.jsonl');
    });


    test('do not keep weekly backups if too old', () => {

        const backupsInfo: BackupsInfo = {
            backups: { 
                'project': [
                    {
                        fileName: 'file1.jsonl',
                        updateSequence: 1,
                        creationDate: new Date('2025-01-01T10:00:00+01:00')
                    },
                    {
                        fileName: 'file2.jsonl',
                        updateSequence: 2,
                        creationDate: new Date('2025-01-08T10:00:00+01:00')
                    },
                    {
                        fileName: 'file3.jsonl',
                        updateSequence: 3,
                        creationDate: new Date('2025-01-15T10:00:00+01:00')
                    },
                    {
                        fileName: 'file4.jsonl',
                        updateSequence: 4,
                        creationDate: new Date('2025-01-22T10:00:00+01:00')
                    }
                ]
            }
        };

        const settings: KeepBackupsSettings = {
            daily: 1,
            weekly: 3,
            monthly: 0
        };

        const currentDate: Date = new Date('2025-02-05T10:00:00+01:00');

        const result: Array<Backup> = getBackupsToDelete(backupsInfo, settings, currentDate);
        expect(result.length).toBe(3);
        expect(result[0].fileName).toBe('file1.jsonl');
        expect(result[1].fileName).toBe('file2.jsonl');
        expect(result[2].fileName).toBe('file3.jsonl');
    });


    test('do not keep monthly backups if too old', () => {

        const backupsInfo: BackupsInfo = {
            backups: { 
                'project': [
                    {
                        fileName: 'file1.jsonl',
                        updateSequence: 1,
                        creationDate: new Date('2025-01-01T10:00:00+01:00')
                    },
                    {
                        fileName: 'file2.jsonl',
                        updateSequence: 2,
                        creationDate: new Date('2025-02-01T10:00:00+01:00')
                    },
                    {
                        fileName: 'file3.jsonl',
                        updateSequence: 3,
                        creationDate: new Date('2025-03-01T10:00:00+01:00')
                    },
                    {
                        fileName: 'file4.jsonl',
                        updateSequence: 4,
                        creationDate: new Date('2025-04-01T10:00:00+01:00')
                    }
                ]
            }
        };

        const settings: KeepBackupsSettings = {
            daily: 1,
            weekly: 0,
            monthly: 3
        };

        const currentDate: Date = new Date('2025-06-01T10:00:00+01:00');
        
        const result: Array<Backup> = getBackupsToDelete(backupsInfo, settings, currentDate);
        expect(result.length).toBe(3);
        expect(result[0].fileName).toBe('file1.jsonl');
        expect(result[1].fileName).toBe('file2.jsonl');
        expect(result[2].fileName).toBe('file3.jsonl');
    });
});
