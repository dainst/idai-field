// Bundled configuration id used to load the Korean fieldwork template; not a project-name prefix.
export const KOREAN_FIELDWORK_PROJECT_IDENTIFIER = 'korean-fieldwork';
export const KOREAN_FIELDWORK_PROJECT_LABEL = '현장 기록';
export const KOREAN_FIELDWORK_PROJECT_LANGUAGES: readonly string[] = ['ko'];
export const DEFAULT_PROJECT_LANGUAGES: readonly string[] = KOREAN_FIELDWORK_PROJECT_LANGUAGES;

export const isKoreanFieldworkProject = (projectIdentifier: string): boolean =>
  projectIdentifier === KOREAN_FIELDWORK_PROJECT_IDENTIFIER;

export const getDefaultProjectLanguages = (_projectIdentifier: string): string[] =>
  KOREAN_FIELDWORK_PROJECT_LANGUAGES.slice();
