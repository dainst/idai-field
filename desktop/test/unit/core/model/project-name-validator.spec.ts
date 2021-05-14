import { ProjectNameValidator } from '../../../../src/app/core/model/project-name-validator';


/**
 * @author Thomas Kleinke
 */
describe('ProjectNameValidator', () => {

    it('test project name similarity', () => {

        expect(ProjectNameValidator.isSimilar('project', 'project-test')).toBe(true);
        expect(ProjectNameValidator.isSimilar('project', 'test-project')).toBe(true);
        expect(ProjectNameValidator.isSimilar('project-1', 'project-2')).toBe(true);
        expect(ProjectNameValidator.isSimilar('one-project', 'other-project')).toBe(false);
        expect(ProjectNameValidator.isSimilar('abc', 'xyz')).toBe(false);
    });
});
