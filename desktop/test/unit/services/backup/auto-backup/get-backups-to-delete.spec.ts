import { KeepBackupsSettings } from '../../../../../src/app/services/settings/keep-backups-settings';
import { getBackupsToDelete } from '../../../../../src/app/services/backup/auto-backup/get-backups-to-delete';
import { Backup } from '../../../../../src/app/services/backup/model/backup';
import { BackupsMap } from '../../../../../src/app/services/backup/model/backups-map';


/**
 * @author Thomas Kleinke
 */
describe('get backups to delete', () => {

    test('keep only latest backup', () => {

        const backups: BackupsMap = {
            'project': [
                {
                    filePath: 'file1.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T10:00:00+01:00')
                },
                {
                    filePath: 'file2.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-02T10:00:00+01:00')
                },
                {
                    filePath: 'file3.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-02T11:00:00+01:00')
                }
            ]
        };

        const settings: KeepBackupsSettings = {
            custom: 0,
            customInterval: 0,
            daily: 0,
            weekly: 0,
            monthly: 0
        };

        const recentlyCreatedBackups: { [project: string]: Array<Backup> } = {
            project: [
                {
                    filePath: 'file3.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-02T11:00:00+01:00')
                }
            ]
        };

        const result: Array<Backup> = getBackupsToDelete(backups, recentlyCreatedBackups, settings);
        expect(result.length).toBe(2);
        expect(result[0].filePath).toBe('file1.jsonl');
        expect(result[1].filePath).toBe('file2.jsonl');
    });


    test('keep one daily backup', () => {

        const backups: BackupsMap = {
            'project': [
                {
                    filePath: 'file1.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T10:00:00+01:00')
                },
                {
                    filePath: 'file2.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-02T10:00:00+01:00')
                },
                {
                    filePath: 'file3.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-02T11:00:00+01:00')
                },
                {
                    filePath: 'file4.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-02T12:00:00+01:00')
                }
            ]
        };

        const settings: KeepBackupsSettings = {
            custom: 0,
            customInterval: 0,
            daily: 1,
            weekly: 0,
            monthly: 0
        };

        const recentlyCreatedBackups: { [project: string]: Array<Backup> } = {
            project: [
                {
                    filePath: 'file4.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-02T12:00:00+01:00')
                }
            ]
        };

        const result: Array<Backup> = getBackupsToDelete(backups, recentlyCreatedBackups, settings);
        expect(result.length).toBe(2);
        expect(result[0].filePath).toBe('file1.jsonl');
        expect(result[1].filePath).toBe('file3.jsonl');
    });


    test('keep three daily backups', () => {

        const backups: BackupsMap = {
            'project': [
                {
                    filePath: 'file1.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T10:00:00+01:00')
                },
                {
                    filePath: 'file2.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-02T11:00:00+01:00')
                },
                {
                    filePath: 'file3.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-02T23:00:00+01:00')
                },
                {
                    filePath: 'file4.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-03T00:00:00+01:00')
                },
                {
                    filePath: 'file5.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-03T01:00:00+01:00')
                },
                {
                    filePath: 'file6.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-04T11:00:00+01:00')
                }
            ]
        };

        const settings: KeepBackupsSettings = {
            custom: 0,
            customInterval: 0,
            daily: 3,
            weekly: 0,
            monthly: 0
        };

        const recentlyCreatedBackups: { [project: string]: Array<Backup> } = {
            project: [
                {
                    filePath: 'file6.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-04T11:00:00+01:00')
                }
            ]
        };

        const result: Array<Backup> = getBackupsToDelete(backups, recentlyCreatedBackups, settings);
        expect(result.length).toBe(3);
        expect(result[0].filePath).toBe('file1.jsonl');
        expect(result[1].filePath).toBe('file3.jsonl');
        expect(result[2].filePath).toBe('file5.jsonl');
    });


    test('keep one daily and one weekly backup', () => {

        const backups: BackupsMap = {
            'project': [
                {
                    filePath: 'file1.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T10:00:00+01:00')
                },
                {
                    filePath: 'file2.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-09T10:00:00+01:00')
                },
                {
                    filePath: 'file3.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-17T10:00:00+01:00')
                },
                {
                    filePath: 'file4.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-18T10:00:00+01:00')
                },
                {
                    filePath: 'file5.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-19T10:00:00+01:00')
                }
            ]
        };

        const settings: KeepBackupsSettings = {
            custom: 0,
            customInterval: 0,
            daily: 1,
            weekly: 1,
            monthly: 0
        };

        const recentlyCreatedBackups: { [project: string]: Array<Backup> } = {
            project: [
                {
                    filePath: 'file5.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-19T10:00:00+01:00')
                }
            ]
        };

        const result: Array<Backup> = getBackupsToDelete(backups, recentlyCreatedBackups, settings);
        expect(result.length).toBe(3);
        expect(result[0].filePath).toBe('file1.jsonl');
        expect(result[1].filePath).toBe('file2.jsonl');
        expect(result[2].filePath).toBe('file4.jsonl');
    });


    test('keep one daily, one weekly and one monthly backup', () => {

        const backups: BackupsMap = {
            'project': [
                {
                    filePath: 'file1.jsonl',
                    project: 'project',
                    creationDate: new Date('2024-12-15T10:00:00+01:00')
                },
                {
                    filePath: 'file2.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T10:00:00+01:00')
                },
                {
                    filePath: 'file3.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-09T10:00:00+01:00')
                },
                {
                    filePath: 'file4.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-17T10:00:00+01:00')
                },
                {
                    filePath: 'file5.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-18T10:00:00+01:00')
                },
                {
                    filePath: 'file6.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-19T10:00:00+01:00')
                }
            ]
        };

        const settings: KeepBackupsSettings = {
            custom: 0,
            customInterval: 0,
            daily: 1,
            weekly: 1,
            monthly: 1
        };

        const recentlyCreatedBackups: { [project: string]: Array<Backup> } = {
            project: [
                {
                    filePath: 'file6.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-19T10:00:00+01:00')
                }
            ]
        };

        const result: Array<Backup> = getBackupsToDelete(backups, recentlyCreatedBackups, settings);
        expect(result.length).toBe(3);
        expect(result[0].filePath).toBe('file1.jsonl');
        expect(result[1].filePath).toBe('file3.jsonl');
        expect(result[2].filePath).toBe('file5.jsonl');
    });


    test('keep three daily, three weekly and three monthly backups', () => {

        const backups: BackupsMap = {
            'project': [
                {
                    filePath: 'file1.jsonl',
                    project: 'project',
                    creationDate: new Date('2024-10-15T10:00:00+01:00')
                },
                {
                    filePath: 'file2.jsonl',
                    project: 'project',
                    creationDate: new Date('2024-11-15T10:00:00+01:00')
                },
                {
                    filePath: 'file3.jsonl',
                    project: 'project',
                    creationDate: new Date('2024-11-16T10:00:00+01:00')
                },
                {
                    filePath: 'file4.jsonl',
                    project: 'project',
                    creationDate: new Date('2024-12-15T10:00:00+01:00')
                },
                {
                    filePath: 'file5.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T10:00:00+01:00')
                },
                {
                    filePath: 'file6.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-08T10:00:00+01:00')
                },
                {
                    filePath: 'file7.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-17T10:00:00+01:00')
                },
                {
                    filePath: 'file8.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-21T10:00:00+01:00')
                },
                {
                    filePath: 'file9.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-28T10:00:00+01:00')
                },
                {
                    filePath: 'file10.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-28T11:00:00+01:00')
                },
                {
                    filePath: 'file11.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-29T10:00:00+01:00')
                },
                {
                    filePath: 'file12.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-30T10:00:00+01:00')
                },
                {
                    filePath: 'file13.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-31T10:00:00+01:00')
                }
            ]
        };

        const settings: KeepBackupsSettings = {
            custom: 0,
            customInterval: 0,
            daily: 3,
            weekly: 3,
            monthly: 3
        };

        const recentlyCreatedBackups: { [project: string]: Array<Backup> } = {
            project: [
                {
                    filePath: 'file13.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-31T10:00:00+01:00')
                }
            ]
        };

        const result: Array<Backup> = getBackupsToDelete(backups, recentlyCreatedBackups, settings);
        expect(result.length).toBe(4);
        expect(result[0].filePath).toBe('file1.jsonl');
        expect(result[1].filePath).toBe('file3.jsonl');
        expect(result[2].filePath).toBe('file6.jsonl');
        expect(result[3].filePath).toBe('file10.jsonl');
    });


    test('custom interval: keep three backups, one backup every two hours', () => {

        const backups: BackupsMap = {
            'project': [
                {
                    filePath: 'file1.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T05:00:00+01:00')
                },
                {
                    filePath: 'file2.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T06:00:00+01:00')
                },
                {
                    filePath: 'file3.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T10:00:00+01:00')
                },
                {
                    filePath: 'file4.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T12:50:00+01:00')
                },
                {
                    filePath: 'file5.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T13:30:00+01:00')
                },
                {
                    filePath: 'file6.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T14:00:00+01:00')
                },
                {
                    filePath: 'file7.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T15:00:00+01:00')
                }
            ]
        };

        const settings: KeepBackupsSettings = {
            custom: 3,
            customInterval: 2,
            daily: 0,
            weekly: 0,
            monthly: 0
        };

        const recentlyCreatedBackups: { [project: string]: Array<Backup> } = {
            project: [
                {
                    filePath: 'file7.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T15:00:00+01:00')
                }
            ]
        };

        const result: Array<Backup> = getBackupsToDelete(backups, recentlyCreatedBackups, settings);
        console.log(result);
        expect(result.length).toBe(4);
        expect(result[0].filePath).toBe('file1.jsonl');
        expect(result[1].filePath).toBe('file2.jsonl');
        expect(result[2].filePath).toBe('file5.jsonl');
        expect(result[3].filePath).toBe('file6.jsonl');
    });


    test('custom interval: keep five backups, one backup per hour', () => {

        const backups: BackupsMap = {
            'project': [
                {
                    filePath: 'file1.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T05:00:00+01:00')
                },
                {
                    filePath: 'file2.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T06:00:00+01:00')
                },
                {
                    filePath: 'file3.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T07:00:00+01:00')
                },
                {
                    filePath: 'file4.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T08:00:00+01:00')
                },
                {
                    filePath: 'file5.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T09:00:00+01:00')
                },
                {
                    filePath: 'file6.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T09:30:00+01:00')
                },
                {
                    filePath: 'file7.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T10:00:00+01:00')
                },
                {
                    filePath: 'file8.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T10:30:00+01:00')
                },
                {
                    filePath: 'file9.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T11:00:00+01:00')
                }
            ]
        };

        const settings: KeepBackupsSettings = {
            custom: 5,
            customInterval: 1,
            daily: 0,
            weekly: 0,
            monthly: 0
        };

        const recentlyCreatedBackups: { [project: string]: Array<Backup> } = {
            project: [
                {
                    filePath: 'file9.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T11:00:00+01:00')
                }
            ]
        };

        const result: Array<Backup> = getBackupsToDelete(backups, recentlyCreatedBackups, settings);
        expect(result.length).toBe(4);
        expect(result[0].filePath).toBe('file1.jsonl');
        expect(result[1].filePath).toBe('file2.jsonl');
        expect(result[2].filePath).toBe('file6.jsonl');
        expect(result[3].filePath).toBe('file8.jsonl');
    });


    test('combine custom interval with daily, weekly and monthly backups', () => {

        const backups: BackupsMap = {
            'project': [
                {
                    filePath: 'file1.jsonl',
                    project: 'project',
                    creationDate: new Date('2024-12-15T10:00:00+01:00')
                },
                {
                    filePath: 'file2.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-01T10:00:00+01:00')
                },
                {
                    filePath: 'file3.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-09T10:00:00+01:00')
                },
                {
                    filePath: 'file4.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-17T10:00:00+01:00')
                },
                {
                    filePath: 'file5.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-18T10:00:00+01:00')
                },
                {
                    filePath: 'file6.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-19T10:00:00+01:00')
                },
                {
                    filePath: 'file7.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-19T14:00:00+01:00')
                },
                {
                    filePath: 'file8.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-19T17:00:00+01:00')
                },
                {
                    filePath: 'file9.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-19T19:00:00+01:00')
                },
                {
                    filePath: 'file10.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-19T20:00:00+01:00')
                }
            ]
        };

        const settings: KeepBackupsSettings = {
            custom: 2,
            customInterval: 3,
            daily: 1,
            weekly: 1,
            monthly: 1
        };

        const recentlyCreatedBackups: { [project: string]: Array<Backup> } = {
            project: [
                {
                    filePath: 'file10.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-19T20:00:00+01:00')
                }
            ]
        };

        const result: Array<Backup> = getBackupsToDelete(backups, recentlyCreatedBackups, settings);
        expect(result.length).toBe(5);
        expect(result[0].filePath).toBe('file1.jsonl');
        expect(result[1].filePath).toBe('file3.jsonl');
        expect(result[2].filePath).toBe('file5.jsonl');
        expect(result[3].filePath).toBe('file7.jsonl');
        expect(result[4].filePath).toBe('file9.jsonl');
    });


    test('delete recently updated backup', () => {

        const backups: BackupsMap = {
            'project': [
                {
                    filePath: 'file1.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-02T11:00:00+01:00')
                },
                {
                    filePath: 'file2.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-02T11:00:10+01:00')
                }
            ]
        };

        const settings: KeepBackupsSettings = {
            custom: 0,
            customInterval: 0,
            daily: 0,
            weekly: 0,
            monthly: 0
        };

        const recentlyCreatedBackups: { [project: string]: Array<Backup> } = {
            project: [
                {
                    filePath: 'file1.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-02T11:00:00+01:00'),
                },
                {
                    filePath: 'file2.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-02T11:00:10+01:00')
                }
            ]
        };

        const result: Array<Backup> = getBackupsToDelete(backups, recentlyCreatedBackups, settings);
        expect(result.length).toBe(1);
        expect(result[0].filePath).toBe('file1.jsonl');
    });
});
