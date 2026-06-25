import { SAMPLE_PROJECT_ID } from '@/constants/sample-project';

export interface ProjectNameValidation {
  alreadyExists: boolean;
  hasUnsafeCharacters: boolean;
  isAvailable: boolean;
  isPresent: boolean;
  isReserved: boolean;
  projectId: string;
}

export const validateProjectName = (
  projectName: string,
  existingProjects: readonly string[] = []
): ProjectNameValidation => {
  const projectId = normalizeProjectId(projectName);
  const projectLookupKey = createProjectLookupKey(projectId);
  const isPresent = projectId.length > 0;
  const alreadyExists = isPresent && existingProjects.some(
    (existingProject) =>
      createProjectLookupKey(normalizeProjectId(existingProject)) === projectLookupKey
  );
  const isReserved =
    projectLookupKey === createProjectLookupKey(SAMPLE_PROJECT_ID);
  const hasUnsafeCharacters =
    hasUnsafeProjectNameCharacters(projectId)
    || hasReservedWindowsProjectName(projectId);

  return {
    alreadyExists,
    hasUnsafeCharacters,
    isAvailable:
      isPresent && !alreadyExists && !isReserved && !hasUnsafeCharacters,
    isPresent,
    isReserved,
    projectId,
  };
};

export const getProjectNameInvalidText = (
  validation: ProjectNameValidation
): string =>
  validation.alreadyExists
    ? '이미 있는 프로젝트 이름입니다.'
    : validation.isReserved
      ? '앱 내부에서 쓰는 예약 이름입니다.'
      : validation.hasUnsafeCharacters
        ? '프로젝트 이름에 / \\ : * ? " < > | 같은 문자는 쓸 수 없습니다.'
        : '프로젝트 이름을 입력해야 합니다.';

const normalizeProjectId = (projectName: string): string => projectName.trim();

const createProjectLookupKey = (projectId: string): string =>
  projectId.toLocaleLowerCase();

const hasUnsafeProjectNameCharacters = (projectId: string): boolean =>
  /[<>:"/\\|?*\u0000-\u001f]/.test(projectId)
  || projectId === '.'
  || projectId === '..'
  || projectId.endsWith('.');

const hasReservedWindowsProjectName = (projectId: string): boolean =>
  /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i.test(projectId);
