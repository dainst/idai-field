import {ProjectNameValidator} from '../../../../src/app/core/model/project-name-validator';


/**
 * @author Thomas Kleinke
 */
describe('ProjectNameValidator', () => {

    it('test project name similarity', () => {

        expect(ProjectNameValidator.isSimilar('project', 'project-test')).toBeTrue();
        expect(ProjectNameValidator.isSimilar('project', 'test-project')).toBeTrue();
        expect(ProjectNameValidator.isSimilar('project-1', 'project-2')).toBeTrue();
        expect(ProjectNameValidator.isSimilar('one-project', 'other-project')).toBeFalse();
        expect(ProjectNameValidator.isSimilar('abc', 'xyz')).toBeFalse();
    });
});
