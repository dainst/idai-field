export const KOREAN_FIELDWORK_PROJECT_IDENTIFIER = 'korean-fieldwork';
export const KOREAN_FIELDWORK_PROJECT_LABEL = '한국형 야장';
export const KOREAN_FIELDWORK_PROJECT_PREFIX = `${KOREAN_FIELDWORK_PROJECT_IDENTIFIER}-`;
export const KOREAN_FIELDWORK_PROJECT_LANGUAGES: ReadonlyArray<string> = ['ko'];
export const DEFAULT_PROJECT_LANGUAGES: ReadonlyArray<string> = KOREAN_FIELDWORK_PROJECT_LANGUAGES;

export const isKoreanFieldworkProject = (projectIdentifier: string): boolean =>
  projectIdentifier === KOREAN_FIELDWORK_PROJECT_IDENTIFIER
  || projectIdentifier.startsWith(KOREAN_FIELDWORK_PROJECT_PREFIX);

export const getDefaultProjectLanguages = (_projectIdentifier: string): string[] =>
  KOREAN_FIELDWORK_PROJECT_LANGUAGES.slice();
