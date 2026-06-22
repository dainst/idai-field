import {
  buildEvidenceBundle,
  Document,
  EvidenceBundle,
} from 'idai-field-core';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

export interface KoreanFieldworkEvidenceChip {
  id: string;
  label: string;
  count: number;
  tone: 'filled'|'empty';
}

const C = KOREAN_FIELDWORK_CATEGORIES;

const EVIDENCE_TARGET_CATEGORIES = [
  C.OPERATION,
  C.TRENCH,
  C.FEATURE_GROUP,
  C.FEATURE,
  C.FEATURE_SEGMENT,
  C.LAYER,
];

const EVIDENCE_DEFINITIONS = [
  {
    id: 'featureSegments',
    label: '피트',
    getCount: (bundle: EvidenceBundle) => bundle.featureSegments.length,
    categories: [C.OPERATION, C.TRENCH, C.FEATURE_GROUP, C.FEATURE],
  },
  {
    id: 'layers',
    label: '층위',
    getCount: (bundle: EvidenceBundle) => bundle.layers.length,
    categories: [C.TRENCH, C.FEATURE_GROUP, C.FEATURE, C.FEATURE_SEGMENT],
  },
  {
    id: 'photos',
    label: '사진',
    getCount: (bundle: EvidenceBundle) => bundle.photos.length,
    categories: EVIDENCE_TARGET_CATEGORIES,
  },
  {
    id: 'soilProfilePhotos',
    label: '토층',
    getCount: (bundle: EvidenceBundle) => bundle.soilProfilePhotos.length,
    categories: [C.OPERATION, C.FEATURE, C.FEATURE_SEGMENT],
  },
  {
    id: 'finds',
    label: '유물',
    getCount: (bundle: EvidenceBundle) => bundle.finds.length,
    categories: EVIDENCE_TARGET_CATEGORIES,
  },
  {
    id: 'samples',
    label: '시료',
    getCount: (bundle: EvidenceBundle) => bundle.samples.length,
    categories: EVIDENCE_TARGET_CATEGORIES,
  },
];

export const getKoreanFieldworkEvidenceChips = (
  document: Document,
  documents: Document[]
): KoreanFieldworkEvidenceChip[] => {
  if (!EVIDENCE_TARGET_CATEGORIES.includes(document.resource.category)) {
    return [];
  }

  const bundle = buildEvidenceBundle(document, documents);

  return EVIDENCE_DEFINITIONS
    .filter((definition) =>
      definition.categories.includes(document.resource.category)
    )
    .map((definition) => {
      const count = definition.getCount(bundle);

      return {
        id: definition.id,
        label: definition.label,
        count,
        tone: count > 0 ? 'filled' : 'empty',
      };
    });
};
