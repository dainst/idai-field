import {
  getKoreanFieldworkRecordListEmptyState,
} from './korean-fieldwork-record-list-empty-state';

describe('korean-fieldwork-record-list-empty-state', () => {
  it('points empty projects to the first map record', () => {
    expect(getKoreanFieldworkRecordListEmptyState({
      activeCategoryFilterId: 'all',
      activeWorkFilterId: 'all',
      query: '',
      totalDocumentCount: 0,
    })).toEqual({
      icon: 'add-location-alt',
      title: '아직 기록이 없습니다',
      text: '지도에서 조사 경계를 먼저 만들고, 트렌치·유구·유물 기록을 이어가세요.',
    });
  });

  it('explains when search hides existing records', () => {
    expect(getKoreanFieldworkRecordListEmptyState({
      activeCategoryFilterId: 'all',
      activeWorkFilterId: 'all',
      query: '없는기록',
      totalDocumentCount: 3,
    })).toEqual({
      icon: 'search-off',
      title: '검색 결과가 없습니다',
      text: '검색어를 지우거나 식별자·설명·기록 종류를 다시 확인하세요.',
    });
  });

  it('explains when filters hide existing records', () => {
    expect(getKoreanFieldworkRecordListEmptyState({
      activeCategoryFilterId: 'feature',
      activeWorkFilterId: 'needsWork',
      query: '',
      totalDocumentCount: 3,
    })).toEqual({
      icon: 'filter-list-off',
      title: '선택한 조건에 맞는 기록이 없습니다',
      text: '분류나 작업 상태를 전체로 바꾸면 숨겨진 기록을 다시 볼 수 있습니다.',
    });
  });
});
