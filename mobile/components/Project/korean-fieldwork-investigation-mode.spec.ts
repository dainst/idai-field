import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createKoreanFieldworkInvestigationModeStorageKey,
  getKoreanFieldworkInvestigationMode,
  loadKoreanFieldworkInvestigationModeId,
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
        '반절·토층둑·조사 중 사진',
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
});
