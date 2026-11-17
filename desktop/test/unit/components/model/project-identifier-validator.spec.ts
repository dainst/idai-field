import { ProjectIdentifierValidation } from '../../../../src/app/model/project-identifier-validation';


/**
 * @author Thomas Kleinke
 */
describe('ProjectIdentifierValidator', () => {

    test('validate project identifier: allowed identifier', () => {

        expect(ProjectIdentifierValidation.validate('project1')).toBeUndefined();
        expect(ProjectIdentifierValidation.validate('project-identifier')).toBeUndefined();
        expect(ProjectIdentifierValidation.validate('project_identifier')).toBeUndefined();
    });


    test('validate project identifier: unallowed characters', () => {

        expect(ProjectIdentifierValidation.validate('project$'))
            .toEqual([ProjectIdentifierValidation.Errors.PROJECT_IDENTIFIER_ERROR_CHARACTERS]);
        expect(ProjectIdentifierValidation.validate('Project'))
            .toEqual([ProjectIdentifierValidation.Errors.PROJECT_IDENTIFIER_ERROR_CHARACTERS]);
        expect(ProjectIdentifierValidation.validate('äöü'))
            .toEqual([ProjectIdentifierValidation.Errors.PROJECT_IDENTIFIER_ERROR_CHARACTERS]);
    });


    test('validate project identifier: first character is not a letter', () => {

        expect(ProjectIdentifierValidation.validate('1project'))
            .toEqual([ProjectIdentifierValidation.Errors.PROJECT_IDENTIFIER_ERROR_STARTING_CHARACTER]);
        expect(ProjectIdentifierValidation.validate('_project'))
            .toEqual([ProjectIdentifierValidation.Errors.PROJECT_IDENTIFIER_ERROR_STARTING_CHARACTER]);
        expect(ProjectIdentifierValidation.validate('-project'))
            .toEqual([ProjectIdentifierValidation.Errors.PROJECT_IDENTIFIER_ERROR_STARTING_CHARACTER]);
    });


    test('validate project identifier: wrong length', () => {

        const projectIdentifier: string = 'project_identifier_with_too_many_characters';
        const expectedLengthDifference: number =
            projectIdentifier.length - ProjectIdentifierValidation.PROJECT_IDENTIFIER_MAX_LENGTH;

        expect(ProjectIdentifierValidation.validate(projectIdentifier))
            .toEqual([
                ProjectIdentifierValidation.Errors.PROJECT_IDENTIFIER_ERROR_LENGTH,
                expectedLengthDifference.toString()
            ]);
    });


    test('validate project identifier: already existing identifier', () => {
        
        expect(ProjectIdentifierValidation.validate('project1', ['project1']))
            .toEqual([ProjectIdentifierValidation.Errors.PROJECT_IDENTIFIER_ERROR_EXISTS, 'project1']);
    });


    test('validate project identifier: no identifier', () => {

        expect(ProjectIdentifierValidation.validate(''))
            .toEqual([ProjectIdentifierValidation.Errors.PROJECT_IDENTIFIER_ERROR_MISSING]);
        expect(ProjectIdentifierValidation.validate('   '))
            .toEqual([ProjectIdentifierValidation.Errors.PROJECT_IDENTIFIER_ERROR_MISSING]);
    });


    test('test project identifier similarity', () => {

        expect(ProjectIdentifierValidation.isSimilar('project', 'project-test')).toBe(true);
        expect(ProjectIdentifierValidation.isSimilar('project', 'test-project')).toBe(true);
        expect(ProjectIdentifierValidation.isSimilar('project-1', 'project-2')).toBe(true);
        expect(ProjectIdentifierValidation.isSimilar('one-project', 'other-project')).toBe(false);
        expect(ProjectIdentifierValidation.isSimilar('abc', 'xyz')).toBe(false);
    });
});
