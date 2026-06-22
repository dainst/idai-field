import {
  Document,
  NewDocument,
} from 'idai-field-core';

export const LAYER_SEQUENCE_MEANING_DEFAULT = 'latestToEarliest';
export const SOIL_COLOR_ASSIST_STATUS_DEFAULT = 'notRun';

export const createDepictsRelation = (targetDoc: Document): { depicts: string[] } => ({
  depicts: [targetDoc.resource.id],
});

export const createKoreanFieldworkChildRelations = (
  parentDoc: Document
): { [relationName: string]: string[] } => {
  const parentRelations = parentDoc.resource.relations ?? {};

  if (!parentRelations.isRecordedIn) return { isRecordedIn: [parentDoc.resource.id] };

  return {
    isRecordedIn: [parentRelations.isRecordedIn[0]],
    liesWithin: [parentDoc.resource.id],
  };
};

export const createSoilProfilePhotoDraft = (targetDoc: Document): NewDocument => ({
  resource: {
    identifier: `soil-profile-photo-${Date.now()}`,
    category: 'SoilProfilePhoto',
    relations: createDepictsRelation(targetDoc),
    soilProfileAnnotationStrokes: '[]',
    soilProfileLayerMarkers: '[]',
    soilProfileLayerIds: '[]',
    layerSequenceMeaning: LAYER_SEQUENCE_MEANING_DEFAULT,
  },
});

export const createLayerDraft = (
  parentDoc: Document,
  sequenceNumber: number
): NewDocument => ({
  resource: {
    identifier: `layer-${Date.now()}-${sequenceNumber}`,
    category: 'Layer',
    relations: createKoreanFieldworkChildRelations(parentDoc),
    layerSequenceNumber: sequenceNumber,
    layerSequenceMeaning: LAYER_SEQUENCE_MEANING_DEFAULT,
    soilColorAssistStatus: SOIL_COLOR_ASSIST_STATUS_DEFAULT,
  },
});
