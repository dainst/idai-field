import { getExistingBackups } from '../../../../../src/app/services/backup/auto-backup/get-existing-backups';
import { BackupsMap } from '../../../../../src/app/services/backup/model/backups-map';


/**
 * @author Thomas Kleinke
 */
describe('get existing backups', () => {

    test('build backups map', () => {

        const backups: BackupsMap = getExistingBackups(process.cwd() + '/test/test-data/backups');

        expect(backups).toEqual({
            'project': [
                {
                    fileName: 'project.2025-01-02.10-30-20.jsonl',
                    creationDate: new Date('2025-01-02T10:30:20+01:00')
                },
                {
                    fileName: 'project.2025-02-03.01-02-03.jsonl',
                    creationDate: new Date('2025-02-03T01:02:03+01:00')
                }
            ],
            'project-with-special_characters': [
                {
                    fileName: 'project-with-special_characters.2025-01-02.10-30-20.jsonl',
                    creationDate: new Date('2025-01-02T10:30:20+01:00')
                }
            ]
        });
    });
});
