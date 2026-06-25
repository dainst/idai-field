import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createKoreanFieldworkProjectSetupResourceUpdates,
  createKoreanFieldworkBoundarySummaryStorageKey,
  createKoreanFieldworkInvestigationModeStorageKey,
  getKoreanFieldworkInvestigationMode,
  getKoreanFieldworkProjectSetupDefaultsFromDocument,
  loadKoreanFieldworkBoundarySummary,
  loadKoreanFieldworkProjectSetupDefaults,
  loadKoreanFieldworkInvestigationModeId,
  saveKoreanFieldworkBoundarySummary,
  saveKoreanFieldworkInvestigationModeId,
} from './korean-fieldwork-investigation-mode';

describe('Korean fieldwork investigation mode', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('keeps trench-based 조사 requirements separate from excavation flow', () => {
    expect(getKoreanFieldworkInvestigationMode('trialTrench')).toMatchObject({
      label: '표본·시굴조사',
      primaryAction: '트렌치부터 잡기',
      requirements: expect.arrayContaining([
        '토층 정리 여부',
        '피트 조사와 피트 토층도',
      ]),
    });
    expect(getKoreanFieldworkInvestigationMode('excavation')).toMatchObject({
      label: '발굴조사',
      primaryAction: '유구부터 기록',
      requirements: expect.arrayContaining([
        '조사 중 사진과 토층 확인',
        '스케치·약측·실측 연결',
        '유물 수습과 완료 사진',
      ]),
    });
  });

  it('persists the selected mode by project', async () => {
    await saveKoreanFieldworkInvestigationModeId('project-1', 'excavation');

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      createKoreanFieldworkInvestigationModeStorageKey('project-1'),
      'excavation'
    );
    await expect(loadKoreanFieldworkInvestigationModeId('project-1'))
      .resolves.toBe('excavation');
  });

  it('persists the boundary summary by project without project-name prefixes', async () => {
    await saveKoreanFieldworkBoundarySummary(
      'area-2026',
      '  1구역 북쪽 능선부터 남쪽 농로까지  '
    );

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      createKoreanFieldworkBoundarySummaryStorageKey('area-2026'),
      '1구역 북쪽 능선부터 남쪽 농로까지'
    );
    await expect(loadKoreanFieldworkBoundarySummary('area-2026'))
      .resolves.toBe('1구역 북쪽 능선부터 남쪽 농로까지');

    await saveKoreanFieldworkBoundarySummary('area-2026', '   ');

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      createKoreanFieldworkBoundarySummaryStorageKey('area-2026')
    );
  });

  it('loads project setup defaults from the project document when local storage is empty', async () => {
    const projectDocument = {
      resource: {
        projectBoundarySummary: '1구역 북쪽 능선부터 남쪽 농로까지',
        projectInvestigationMode: 'trialTrench',
      },
    } as any;

    await expect(loadKoreanFieldworkProjectSetupDefaults(
      'project-1',
      projectDocument
    )).resolves.toEqual({
      boundarySummary: '1구역 북쪽 능선부터 남쪽 농로까지',
      investigationModeId: 'trialTrench',
    });
  });

  it('builds synced project document updates with valid Korean fieldwork values', () => {
    expect(createKoreanFieldworkProjectSetupResourceUpdates({
      boundarySummary: '  1구역 북쪽 능선부터 남쪽 농로까지  ',
      investigationModeId: 'excavation',
    })).toEqual({
      projectBoundarySetupState: 'draftBoundary',
      projectBoundarySummary: '1구역 북쪽 능선부터 남쪽 농로까지',
      projectInvestigationMode: 'excavation',
      shortDescription: '1구역 북쪽 능선부터 남쪽 농로까지',
    });
  });

  it('ignores invalid project document mode values', () => {
    expect(getKoreanFieldworkProjectSetupDefaultsFromDocument({
      resource: {
        projectBoundarySummary: '경계 기준',
        projectInvestigationMode: 'bad-mode',
      },
    } as any)).toEqual({
      boundarySummary: '경계 기준',
      investigationModeId: undefined,
    });
  });
});
