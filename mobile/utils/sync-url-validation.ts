export interface SyncUrlValidation {
  isPresent: boolean;
  isValid: boolean;
  url: string;
}

export const validateSyncUrl = (url: string): SyncUrlValidation => {
  const normalizedUrl = url.trim();
  const isPresent = normalizedUrl.length > 0;

  return {
    isPresent,
    isValid: isPresent && hasHttpProtocol(normalizedUrl),
    url: normalizedUrl,
  };
};

export const getSyncUrlInvalidText = (
  validation: SyncUrlValidation
): string =>
  validation.isPresent
    ? 'http:// 또는 https://로 시작하는 서버 URL을 입력하세요.'
    : '서버 URL을 입력해야 합니다.';

const hasHttpProtocol = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};
