import {
  getProjectNameInvalidText,
  validateProjectName,
} from './project-name-validation';
import { SAMPLE_PROJECT_ID } from '@/constants/sample-project';

describe('project name validation', () => {
  it('normalizes project names before checking availability', () => {
    expect(validateProjectName('  Fieldwork-1  ', [' fieldwork-1 '])).toEqual({
      alreadyExists: true,
      hasUnsafeCharacters: false,
      isAvailable: false,
      isPresent: true,
      isReserved: false,
      projectId: 'Fieldwork-1',
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

  it('rejects names that would be unsafe as local database names', () => {
    const validation = validateProjectName('field/work:1');

    expect(validation).toEqual({
      alreadyExists: false,
      hasUnsafeCharacters: true,
      isAvailable: false,
      isPresent: true,
      isReserved: false,
      projectId: 'field/work:1',
    });
    expect(getProjectNameInvalidText(validation)).toBe(
      '프로젝트 이름에 / \\ : * ? " < > | 같은 문자는 쓸 수 없습니다.'
    );
  });

  it('rejects app-reserved project names', () => {
    const validation = validateProjectName(SAMPLE_PROJECT_ID.toUpperCase());

    expect(validation).toEqual({
      alreadyExists: false,
      hasUnsafeCharacters: false,
      isAvailable: false,
      isPresent: true,
      isReserved: true,
      projectId: SAMPLE_PROJECT_ID.toUpperCase(),
    });
    expect(getProjectNameInvalidText(validation)).toBe(
      '앱 내부에서 쓰는 예약 이름입니다.'
    );
  });
});
