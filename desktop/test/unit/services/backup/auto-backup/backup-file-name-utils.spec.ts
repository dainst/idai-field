import { buildBackupFileName, parseBackupFileName } from '../../../../../src/app/services/backup/auto-backup/backup-file-name-utils';


/**
 * @author Thomas Kleinke
 */
describe('backup file name utils', () => {

    test('build backup file name', () => {

        expect(buildBackupFileName('project', new Date('2025-01-02T10:30:20+01:00')))
            .toBe('project.2025-01-02.10-30-20.jsonl');

        expect(buildBackupFileName('project', new Date('2025-02-03T01:02:03+01:00')))
            .toBe('project.2025-02-03.01-02-03.jsonl');
    });


    test('parse backup file name', () => {

        expect(parseBackupFileName('project.2025-01-02.10-30-20.jsonl')).toEqual({
            project: 'project',
            creationDate: new Date('2025-01-02T10:30:20+01:00')
        });

        expect(parseBackupFileName('project.2025-02-03.01-02-03.jsonl')).toEqual({
            project: 'project',
            creationDate: new Date('2025-02-03T01:02:03+01:00')
        });

        expect(parseBackupFileName('project-with-special_characters.2025-01-02.10-30-20.jsonl')).toEqual({
            project: 'project-with-special_characters',
            creationDate: new Date('2025-01-02T10:30:20+01:00')
        });
    });
});
