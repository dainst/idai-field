export const SAMPLE_PROJECT_ID = '__idai_mobile_sample_project__';
export const SAMPLE_PROJECT_LABEL = '테스트 프로젝트';

export const isSampleProject = (project: string): boolean =>
  project === SAMPLE_PROJECT_ID;

export const getProjectDisplayName = (project: string): string =>
  isSampleProject(project) ? SAMPLE_PROJECT_LABEL : project;
