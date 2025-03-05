import { getExistingBackups } from '../../../../../src/app/services/backup/auto-backup/get-existing-backups';
import { BackupsMap } from '../../../../../src/app/services/backup/model/backups-map';


/**
 * @author Thomas Kleinke
 */
describe('get existing backups', () => {

    test('build backups map', () => {

        const backupDirectoryPath: string = process.cwd() + '/test/test-data/backups';
        const backups: BackupsMap = getExistingBackups(backupDirectoryPath);

        expect(backups).toEqual({
            'project': [
                {
                    filePath: backupDirectoryPath + '/project.2025-01-02.10-30-20.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-01-02T10:30:20+01:00')
                },
                {
                    filePath: backupDirectoryPath + '/project.2025-02-03.01-02-03.jsonl',
                    project: 'project',
                    creationDate: new Date('2025-02-03T01:02:03+01:00')
                }
            ],
            'project-with-special_characters': [
                {
                    filePath: backupDirectoryPath + '/project-with-special_characters.2025-01-02.10-30-20.jsonl',
                    project: 'project-with-special_characters',
                    creationDate: new Date('2025-01-02T10:30:20+01:00')
                }
            ]
        });
    });
});
