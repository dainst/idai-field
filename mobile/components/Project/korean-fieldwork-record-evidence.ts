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
  documents: Document[];
  createCategoryName?: string;
}

const C = KOREAN_FIELDWORK_CATEGORIES;

interface EvidenceDefinition {
  id: string;
  label: string;
  getDocuments: (bundle: EvidenceBundle) => Document[];
  categories: readonly string[];
  createCategoryName?: string;
}

const EVIDENCE_TARGET_CATEGORIES: readonly string[] = [
  C.OPERATION,
  C.TRENCH,
  C.FEATURE_GROUP,
  C.FEATURE,
  C.FEATURE_SEGMENT,
  C.LAYER,
];

const EVIDENCE_DEFINITIONS: EvidenceDefinition[] = [
  {
    id: 'featureSegments',
    label: '피트',
    getDocuments: (bundle: EvidenceBundle) => bundle.featureSegments,
    categories: [C.OPERATION, C.TRENCH, C.FEATURE_GROUP, C.FEATURE],
    createCategoryName: C.FEATURE_SEGMENT,
  },
  {
    id: 'layers',
    label: '토색 메모',
    getDocuments: (bundle: EvidenceBundle) => bundle.layers,
    categories: [C.TRENCH, C.FEATURE_GROUP, C.FEATURE, C.FEATURE_SEGMENT],
  },
  {
    id: 'photos',
    label: '사진',
    getDocuments: (bundle: EvidenceBundle) => bundle.photos,
    categories: EVIDENCE_TARGET_CATEGORIES,
    createCategoryName: C.PHOTO,
  },
  {
    id: 'soilProfilePhotos',
    label: '토층사진',
    getDocuments: (bundle: EvidenceBundle) => bundle.soilProfilePhotos,
    categories: [C.OPERATION, C.TRENCH, C.FEATURE, C.FEATURE_SEGMENT],
    createCategoryName: C.SOIL_PROFILE_PHOTO,
  },
  {
    id: 'drawings',
    label: '도면',
    getDocuments: (bundle: EvidenceBundle) => bundle.drawings,
    categories: EVIDENCE_TARGET_CATEGORIES,
    createCategoryName: C.DRAWING,
  },
  {
    id: 'sketches',
    label: '약도·스케치',
    getDocuments: (bundle: EvidenceBundle) => bundle.penMemos,
    categories: EVIDENCE_TARGET_CATEGORIES,
    createCategoryName: C.PEN_MEMO,
  },
  {
    id: 'finds',
    label: '유물',
    getDocuments: (bundle: EvidenceBundle) => bundle.finds,
    categories: EVIDENCE_TARGET_CATEGORIES,
    createCategoryName: C.FIND,
  },
  {
    id: 'samples',
    label: '시료',
    getDocuments: (bundle: EvidenceBundle) => bundle.samples,
    categories: EVIDENCE_TARGET_CATEGORIES,
    createCategoryName: C.SAMPLE,
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
    .flatMap((definition) => {
      const evidenceDocuments = definition.getDocuments(bundle);
      const count = evidenceDocuments.length;
      if (count === 0 && !definition.createCategoryName) return [];

      return [{
        id: definition.id,
        label: definition.label,
        count,
        tone: count > 0 ? 'filled' : 'empty',
        documents: evidenceDocuments,
        createCategoryName: definition.createCategoryName,
      }];
    });
};
