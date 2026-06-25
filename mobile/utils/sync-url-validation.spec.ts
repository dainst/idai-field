import {
  getSyncUrlInvalidText,
  validateSyncUrl,
} from './sync-url-validation';

describe('sync URL validation', () => {
  it('trims and accepts http and https URLs', () => {
    expect(validateSyncUrl('  https://field.example/db  ')).toEqual({
      isPresent: true,
      isValid: true,
      url: 'https://field.example/db',
    });
    expect(validateSyncUrl('http://field.example/db').isValid).toBe(true);
  });

  it('rejects empty values', () => {
    const validation = validateSyncUrl('   ');

    expect(validation).toEqual({
      isPresent: false,
      isValid: false,
      url: '',
    });
    expect(getSyncUrlInvalidText(validation)).toBe('서버 URL을 입력해야 합니다.');
  });

  it('rejects non-http URLs and malformed URLs', () => {
    expect(validateSyncUrl('field.example/db').isValid).toBe(false);
    expect(validateSyncUrl('ftp://field.example/db').isValid).toBe(false);
    expect(getSyncUrlInvalidText(validateSyncUrl('field.example/db'))).toBe(
      'http:// 또는 https://로 시작하는 서버 URL을 입력하세요.'
    );
  });
});
