import {
  createLayerDraft,
  createSoilProfilePhotoDraft,
  LAYER_SEQUENCE_MEANING_DEFAULT,
  SOIL_COLOR_ASSIST_STATUS_DEFAULT,
} from './korean-fieldwork-drafts';

describe('Korean fieldwork map drafts', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates an offline-safe soil profile photo draft linked to the highlighted document', () => {
    const targetDoc = {
      resource: {
        id: 'feature-1',
        category: 'Feature',
      },
    } as any;

    const draft = createSoilProfilePhotoDraft(targetDoc);

    expect(draft.resource).toMatchObject({
      identifier: 'soil-profile-photo-1700000000000',
      category: 'SoilProfilePhoto',
      relations: { depicts: ['feature-1'] },
      soilProfileAnnotationStrokes: '[]',
      soilProfileLayerMarkers: '[]',
      soilProfileLayerIds: '[]',
      layerSequenceMeaning: LAYER_SEQUENCE_MEANING_DEFAULT,
    });
  });

  it('creates Layer drafts with latest-to-earliest numbering and soil color assistance disabled by default', () => {
    const operationDoc = {
      resource: {
        id: 'operation-1',
        category: 'Operation',
        relations: {},
      },
    } as any;

    const draft = createLayerDraft(operationDoc, 1);

    expect(draft.resource).toMatchObject({
      identifier: 'layer-1700000000000-1',
      category: 'Layer',
      relations: { isRecordedIn: ['operation-1'] },
      layerSequenceNumber: 1,
      layerSequenceMeaning: LAYER_SEQUENCE_MEANING_DEFAULT,
      soilColorAssistStatus: SOIL_COLOR_ASSIST_STATUS_DEFAULT,
    });
  });

  it('keeps nested Layer drafts tied to the operation and parent feature', () => {
    const featureDoc = {
      resource: {
        id: 'feature-1',
        category: 'Feature',
        relations: {
          isRecordedIn: ['operation-1'],
        },
      },
    } as any;

    const draft = createLayerDraft(featureDoc, 2);

    expect(draft.resource.relations).toEqual({
      isRecordedIn: ['operation-1'],
      liesWithin: ['feature-1'],
    });
  });
});
