import { getKoreanFieldworkEvidenceChips } from './korean-fieldwork-record-evidence';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('Korean fieldwork record evidence', () => {
  it('summarizes field evidence attached to a feature record', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const pit = createDoc('pit-1', C.FEATURE_SEGMENT, '피트 1', {
      liesWithin: ['feature-1'],
    });
    const layer = createDoc('layer-1', C.LAYER, '토층 1', {
      liesWithin: ['feature-1'],
    });
    const photo = createDoc('photo-1', C.PHOTO, '사진 1', {
      depicts: ['feature-1'],
    });
    const sample = createDoc('sample-1', C.SAMPLE, '시료 1', {
      liesWithin: ['feature-1'],
    });
    const chips = getKoreanFieldworkEvidenceChips(feature, [
      feature,
      pit,
      layer,
      photo,
      sample,
    ] as any);

    expect(chips.map((chip) => ({
      id: chip.id,
      label: chip.label,
      count: chip.count,
      tone: chip.tone,
      createCategoryName: chip.createCategoryName,
      documentIds: chip.documents.map((document) => document.resource.id),
    }))).toEqual([
      {
        id: 'featureSegments',
        label: '피트',
        count: 1,
        tone: 'filled',
        createCategoryName: C.FEATURE_SEGMENT,
        documentIds: ['pit-1'],
      },
      {
        id: 'layers',
        label: '토층',
        count: 1,
        tone: 'filled',
        createCategoryName: C.LAYER,
        documentIds: ['layer-1'],
      },
      {
        id: 'photos',
        label: '사진',
        count: 1,
        tone: 'filled',
        createCategoryName: C.PHOTO,
        documentIds: ['photo-1'],
      },
      {
        id: 'soilProfilePhotos',
        label: '토층',
        count: 0,
        tone: 'empty',
        createCategoryName: C.SOIL_PROFILE_PHOTO,
        documentIds: [],
      },
      {
        id: 'drawings',
        label: '도면',
        count: 0,
        tone: 'empty',
        createCategoryName: C.DRAWING,
        documentIds: [],
      },
      {
        id: 'finds',
        label: '유물',
        count: 0,
        tone: 'empty',
        createCategoryName: C.FIND,
        documentIds: [],
      },
      {
        id: 'samples',
        label: '시료',
        count: 1,
        tone: 'filled',
        createCategoryName: C.SAMPLE,
        documentIds: ['sample-1'],
      },
    ]);
  });

  it('keeps non-structural evidence records compact in the record list', () => {
    expect(getKoreanFieldworkEvidenceChips(
      createDoc('photo-1', C.PHOTO, '사진 1'),
      []
    )).toEqual([]);
  });
});

const createDoc = (
  id: string,
  category: string,
  identifier: string,
  relations: Record<string, string[]> = {}
) => ({
  resource: {
    id,
    identifier,
    category,
    relations,
  },
});
