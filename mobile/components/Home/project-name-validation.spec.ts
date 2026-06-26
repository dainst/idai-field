import {
  getProjectNameInvalidText,
  PROJECT_IDENTIFIER_MAX_LENGTH,
  validateProjectName,
} from './project-name-validation';
import { SAMPLE_PROJECT_ID } from '@/constants/sample-project';

const invalidFormatText =
  '프로젝트 이름은 소문자로 시작하고 소문자, 숫자, 밑줄(_), 하이픈(-)만 사용할 수 있으며 30자 이하여야 합니다.';

describe('project name validation', () => {
  it('normalizes project names before checking availability', () => {
    expect(validateProjectName('  fieldwork-1  ', [' fieldwork-1 '])).toEqual({
      alreadyExists: true,
      hasUnsafeCharacters: false,
      isAvailable: false,
      isPresent: true,
      isReserved: false,
      isTooLong: false,
      projectId: 'fieldwork-1',
    });
  });

  it('treats empty names as missing instead of duplicate', () => {
    const validation = validateProjectName('   ', ['']);

    expect(validation).toEqual({
      alreadyExists: false,
      hasUnsafeCharacters: false,
      isAvailable: false,
      isPresent: false,
      isReserved: false,
      isTooLong: false,
      projectId: '',
    });
    expect(getProjectNameInvalidText(validation)).toBe(
      '프로젝트 이름을 입력해야 합니다.'
    );
  });

  it('uses the duplicate-name message only for existing projects', () => {
    expect(getProjectNameInvalidText(
      validateProjectName('fieldwork-1', ['fieldwork-1'])
    )).toBe('이미 있는 프로젝트 이름입니다.');
  });

  it('accepts server-compatible project names', () => {
    expect(validateProjectName('fieldwork-1').isAvailable).toBe(true);
    expect(validateProjectName('fieldwork_1').isAvailable).toBe(true);
    expect(validateProjectName('f1').isAvailable).toBe(true);
  });

  it('rejects names that the server would reject', () => {
    for (const projectName of [
      'Fieldwork-1',
      '1fieldwork',
      '_fieldwork',
      '-fieldwork',
      'field/work',
      'field work',
      'field.work',
    ]) {
      const validation = validateProjectName(projectName);

      expect(validation.hasUnsafeCharacters).toBe(true);
      expect(validation.isAvailable).toBe(false);
      expect(getProjectNameInvalidText(validation)).toBe(invalidFormatText);
    }
  });

  it('rejects names exceeding the server maximum length', () => {
    const projectName = 'a'.repeat(PROJECT_IDENTIFIER_MAX_LENGTH + 1);
    const validation = validateProjectName(projectName);

    expect(validation.isTooLong).toBe(true);
    expect(validation.isAvailable).toBe(false);
    expect(getProjectNameInvalidText(validation)).toBe(invalidFormatText);
  });

  it('rejects app-reserved project names', () => {
    const validation = validateProjectName(SAMPLE_PROJECT_ID);

    expect(validation).toEqual({
      alreadyExists: false,
      hasUnsafeCharacters: false,
      isAvailable: false,
      isPresent: true,
      isReserved: true,
      isTooLong: false,
      projectId: SAMPLE_PROJECT_ID,
    });
    expect(getProjectNameInvalidText(validation)).toBe(
      '앱에서 쓰는 예약 이름입니다.'
    );
  });
});
