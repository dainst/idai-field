import {
  getProjectDisplayName,
  isSampleProject,
  SAMPLE_PROJECT_ID,
  SAMPLE_PROJECT_LABEL,
} from './sample-project';

describe('sample project constants', () => {
  it('recognizes only the reserved sample project id as the sample project', () => {
    expect(isSampleProject(SAMPLE_PROJECT_ID)).toBe(true);
    expect(isSampleProject('test')).toBe(false);
    expect(isSampleProject(SAMPLE_PROJECT_LABEL)).toBe(false);
  });

  it('shows a readable label for the reserved sample project id', () => {
    expect(getProjectDisplayName(SAMPLE_PROJECT_ID)).toBe(SAMPLE_PROJECT_LABEL);
    expect(getProjectDisplayName('test')).toBe('test');
  });
});
