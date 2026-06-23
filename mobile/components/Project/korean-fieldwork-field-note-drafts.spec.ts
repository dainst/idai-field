import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createKoreanFieldworkFieldNoteDraftKey,
  hasKoreanFieldworkFieldNoteDraftText,
  loadKoreanFieldworkFieldNoteDraft,
  removeKoreanFieldworkFieldNoteDraft,
  saveKoreanFieldworkFieldNoteDraft,
} from './korean-fieldwork-field-note-drafts';

describe('korean-fieldwork-field-note-drafts', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('persists and restores a tablet field note draft per project and record', async () => {
    const key = createKoreanFieldworkFieldNoteDraftKey(
      'project-1',
      'feature-1'
    );

    await saveKoreanFieldworkFieldNoteDraft(key, {
      mode: 'both',
      input: {
        observation: ' 바닥면 원형 윤곽 확인. ',
        interpretation: '주공 가능성 있음.',
      },
      updatedAt: '2026-06-23T01:00:00.000Z',
    });

    await expect(loadKoreanFieldworkFieldNoteDraft(key)).resolves.toEqual({
      mode: 'both',
      input: {
        observation: '바닥면 원형 윤곽 확인.',
        interpretation: '주공 가능성 있음.',
        nextWork: '',
        evidenceNumbers: '',
      },
      updatedAt: '2026-06-23T01:00:00.000Z',
    });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      key,
      expect.stringContaining('바닥면 원형 윤곽 확인.')
    );
  });

  it('removes empty drafts instead of storing them', async () => {
    const key = createKoreanFieldworkFieldNoteDraftKey(
      'project-1',
      'feature-1'
    );

    expect(hasKoreanFieldworkFieldNoteDraftText({
      observation: '',
      interpretation: '   ',
    })).toBe(false);

    await saveKoreanFieldworkFieldNoteDraft(key, {
      mode: 'recordMemo',
      input: {},
      updatedAt: '2026-06-23T01:00:00.000Z',
    });

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(key);

    await removeKoreanFieldworkFieldNoteDraft(key);

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(key);
  });
});
