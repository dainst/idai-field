import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, waitFor } from '@testing-library/react-native';
import {
  createKoreanFieldworkBoundarySummaryStorageKey,
  createKoreanFieldworkInvestigationModeStorageKey,
  saveKoreanFieldworkBoundarySummary,
  saveKoreanFieldworkInvestigationModeId,
} from '@/components/Project/korean-fieldwork-investigation-mode';
import { DocumentRepository } from '@/repositories/document-repository';
import useKoreanFieldworkProjectSetupDefaults from './use-korean-fieldwork-project-setup-defaults';

describe('useKoreanFieldworkProjectSetupDefaults', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('loads project setup defaults from local storage and syncs them to the project document', async () => {
    await saveKoreanFieldworkInvestigationModeId(
      'project-1',
      'surfaceSurvey'
    );
    await saveKoreanFieldworkBoundarySummary(
      'project-1',
      '1구역 북쪽 능선부터 남쪽 농로까지'
    );
    const projectDocument = createProjectDocument({
      identifier: 'project-1',
    });
    const repository = createRepository(projectDocument);

    const { result } = renderHook(() =>
      useKoreanFieldworkProjectSetupDefaults('project-1', repository)
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        boundarySummary: '1구역 북쪽 능선부터 남쪽 농로까지',
        investigationModeId: 'surfaceSurvey',
      });
    });
    await waitFor(() => {
      expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({
        resource: expect.objectContaining({
          projectBoundarySetupState: 'draftBoundary',
          projectBoundarySummary: '1구역 북쪽 능선부터 남쪽 농로까지',
          projectInvestigationMode: 'surfaceSurvey',
          shortDescription: '1구역 북쪽 능선부터 남쪽 농로까지',
        }),
      }));
    });
  });

  it('loads project setup defaults from the project document when local storage is empty', async () => {
    const repository = createRepository(createProjectDocument({
      projectBoundarySetupState: 'draftBoundary',
      projectBoundarySummary: '동쪽 하천부터 서쪽 농로까지',
      projectInvestigationMode: 'trialTrench',
      shortDescription: '동쪽 하천부터 서쪽 농로까지',
    }));

    const { result } = renderHook(() =>
      useKoreanFieldworkProjectSetupDefaults('project-2', repository)
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        boundarySummary: '동쪽 하천부터 서쪽 농로까지',
        investigationModeId: 'trialTrench',
      });
    });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      createKoreanFieldworkInvestigationModeStorageKey('project-2'),
      'trialTrench'
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      createKoreanFieldworkBoundarySummaryStorageKey('project-2'),
      '동쪽 하천부터 서쪽 농로까지'
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('does not read or sync setup defaults before a project is selected', async () => {
    const repository = createRepository(createProjectDocument());

    renderHook(() =>
      useKoreanFieldworkProjectSetupDefaults('', repository)
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(repository.get).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });
});

const createRepository = (projectDocument: any): DocumentRepository => ({
  get: jest.fn().mockResolvedValue(projectDocument),
  update: jest.fn().mockImplementation(async (document) => document),
} as unknown as DocumentRepository);

const createProjectDocument = (
  resourceUpdates: Record<string, unknown> = {}
) => ({
  _id: 'project',
  created: {},
  modified: [],
  resource: {
    category: 'Project',
    id: 'project',
    identifier: 'Project',
    relations: {},
    ...resourceUpdates,
  },
});
