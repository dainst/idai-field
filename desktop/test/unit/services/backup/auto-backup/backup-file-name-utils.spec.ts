import { buildBackupFileName } from '../../../../../src/app/services/backup/auto-backup/backup-file-name-utils';


/**
 * @author Thomas Kleinke
 */
describe('backup file name utils', () => {

    test('build backup file name', () => {

        expect(buildBackupFileName('project', new Date('2025-01-02T10:30:20+01:00')))
            .toBe('project_2025-01-02_10-30-20.jsonl');

        expect(buildBackupFileName('project', new Date('2025-02-03T01:02:03+01:00')))
            .toBe('project_2025-02-03_01-02-03.jsonl');
    });
});
