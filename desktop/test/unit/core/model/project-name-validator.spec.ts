import { ProjectNameValidation } from '../../../../src/app/core/model/project-name-validation';


/**
 * @author Thomas Kleinke
 */
describe('ProjectNameValidator', () => {

    it('test project name similarity', () => {

        expect(ProjectNameValidation.isSimilar('project', 'project-test')).toBe(true);
        expect(ProjectNameValidation.isSimilar('project', 'test-project')).toBe(true);
        expect(ProjectNameValidation.isSimilar('project-1', 'project-2')).toBe(true);
        expect(ProjectNameValidation.isSimilar('one-project', 'other-project')).toBe(false);
        expect(ProjectNameValidation.isSimilar('abc', 'xyz')).toBe(false);
    });
});
