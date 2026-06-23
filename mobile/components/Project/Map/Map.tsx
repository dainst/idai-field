import * as Location from 'expo-location';
import {
  Document,
  KoreanFieldworkReadinessIssue,
} from 'idai-field-core';
import proj4 from 'proj4';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  LayoutChangeEvent,
  LayoutRectangle,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import useMapData from '@/hooks/use-mapdata';
import { DocumentRepository } from '@/repositories/document-repository';
import { ConfigurationContext } from '@/contexts/configuration-context';
import Button from '@/components/common/Button';
import GLMap from './GLMap/GLMap';
import {
  createFeatureCandidateDraft as buildFeatureCandidateDraft,
  createOperationDraft as buildOperationDraft,
  createSoilProfilePhotoDraft as buildSoilProfilePhotoDraft,
  createSurveyBoundaryDraft as buildSurveyBoundaryDraft,
  MapLocation,
} from './korean-fieldwork-drafts';
import {
  FEATURE_CANDIDATE_PARENT_CATEGORIES,
  KOREAN_FIELDWORK_CATEGORIES,
  SOIL_PROFILE_PHOTO_TARGET_CATEGORIES,
} from '../korean-fieldwork-categories';
import MapBottomSheet from './MapBottomSheet';
import { KoreanFieldworkInvestigationModeId } from '../korean-fieldwork-investigation-mode';
import { isKoreanFieldworkChecklistRecord } from '../korean-fieldwork-quick-record';

const FEATURE_GEOMETRY_EDIT_STATUS_NEEDS_AERIAL_ALIGNMENT = 'needsAerialAlignment';
const FEATURE_GEOMETRY_EDIT_STATUS_ADJUSTED_TO_AERIAL_LAYER = 'adjustedToAerialLayer';
const GEOMETRY_SOURCE_AERIAL_LAYER_TRACE = 'aerialLayerTrace';
const GEOMETRY_CONFIDENCE_AERIAL_ALIGNED = 'aerialAligned';

// define projection standards
proj4.defs(
  'WGS84',
  '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'
);
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');
// eslint-disable-next-line max-len
proj4.defs(
  'EPSG:3857',
  '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs'
);

interface MapProps {
  repository: DocumentRepository;
  documents: Document[];
  selectedDocumentIds: string[];
  highlightedDocId?: string;
  addDocument: (parentDoc: Document) => void;
  addDocumentOfCategory: (parentDoc: Document, categoryName: string) => void;
  editDocument: (docID: string, categoryName: string) => void;
  removeDocument: (doc: Document) => void;
  selectParent: (doc: Document) => void;
  readinessIssues: KoreanFieldworkReadinessIssue[];
  investigationModeId?: KoreanFieldworkInvestigationModeId;
}

const Map: React.FC<MapProps> = (props) => {
  const config = useContext(ConfigurationContext);
  const [screen, setScreen] = useState<LayoutRectangle>();
  const [highlightedDoc, setHighlightedDoc] = useState<Document>();
  const [location, setLocation] = useState<MapLocation>();

  const [
    geoDocuments,
    layerDocuments,
    documentToWorldMatrix,
    screenToWorldMatrix,
    viewBox,
    focusMapOnDocumentId,
    updateDoc,
  ] = useMapData(props.repository, props.selectedDocumentIds, screen);

  const setHighlightedDocFromId = useCallback(
    (docId: string) => props.repository.get(docId).then(setHighlightedDoc),
    [props.repository]
  );

  useEffect(() => {
    if (!props.highlightedDocId) return;
    setHighlightedDocFromId(props.highlightedDocId);
  }, [props.highlightedDocId, setHighlightedDocFromId]);

  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;
    let isMounted = true;

    const updateLocation = (coords: Location.LocationObjectCoords) => {
      const { latitude, longitude } = coords;
      const position = { x: longitude, y: latitude };
      const projected = proj4('EPSG:4326', 'EPSG:3857', position);
      if (isMounted) setLocation(projected);
    };

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      updateLocation(currentLocation.coords);

      const nextSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 2,
          timeInterval: 5000,
        },
        (nextLocation) => updateLocation(nextLocation.coords)
      );
      if (isMounted) subscription = nextSubscription;
      else nextSubscription.remove();
    })();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  const canCreateSoilProfilePhoto =
    !!highlightedDoc &&
    !!config?.getCategory(KOREAN_FIELDWORK_CATEGORIES.SOIL_PROFILE_PHOTO) &&
    SOIL_PROFILE_PHOTO_TARGET_CATEGORIES.includes(highlightedDoc.resource.category);

  const operationDocuments = props.documents.filter(
    (document) => document.resource.category === KOREAN_FIELDWORK_CATEGORIES.OPERATION
  );
  const [primaryOperation] = operationDocuments;

  const canCreateSurveyBoundary =
    !!highlightedDoc &&
    !!location &&
    !!config?.getCategory(KOREAN_FIELDWORK_CATEGORIES.SURVEY_BOUNDARY) &&
    highlightedDoc.resource.category === KOREAN_FIELDWORK_CATEGORIES.OPERATION;
  const canCreateSurveyBoundaryInPrimaryOperation =
    !!primaryOperation &&
    !!location &&
    !!config?.getCategory(KOREAN_FIELDWORK_CATEGORIES.SURVEY_BOUNDARY);

  const featureParent = getFeatureCandidateParent(highlightedDoc, props.documents);
  const canCreateFeatureCandidate =
    !!featureParent && !!location && !!config?.getCategory(KOREAN_FIELDWORK_CATEGORIES.FEATURE);
  const canCreateOperation = !!config?.getCategory(KOREAN_FIELDWORK_CATEGORIES.OPERATION);
  const canCreateTrench =
    !!primaryOperation && !!config?.getCategory(KOREAN_FIELDWORK_CATEGORIES.TRENCH);
  const hasRenderableMapContent = geoDocuments.length > 0 || layerDocuments.length > 0;
  const shouldShowStartPanel = operationDocuments.length === 0 || !hasRenderableMapContent;

  const createOperationAndEdit = async () => {
    if (!canCreateOperation) return;

    const createdDocument = await props.repository.create(buildOperationDraft());

    setHighlightedDoc(createdDocument);
    props.editDocument(createdDocument.resource.id, KOREAN_FIELDWORK_CATEGORIES.OPERATION);
  };

  const editPrimaryOperation = () => {
    if (!primaryOperation) return;

    setHighlightedDoc(primaryOperation);
    props.editDocument(primaryOperation.resource.id, KOREAN_FIELDWORK_CATEGORIES.OPERATION);
  };

  const createTrenchInPrimaryOperation = () => {
    if (!primaryOperation || !canCreateTrench) return;

    setHighlightedDoc(primaryOperation);
    props.addDocumentOfCategory(primaryOperation, KOREAN_FIELDWORK_CATEGORIES.TRENCH);
  };

  const createFeatureCandidateAtCurrentLocation = async () => {
    if (!featureParent || !location || !config?.getCategory(KOREAN_FIELDWORK_CATEGORIES.FEATURE)) return;

    const createdDocument = await props.repository.create(
      buildFeatureCandidateDraft(featureParent, location)
    );

    setHighlightedDoc(createdDocument);
  };

  const createFeatureCandidateAndEdit = async () => {
    if (!featureParent || !location || !config?.getCategory(KOREAN_FIELDWORK_CATEGORIES.FEATURE)) return;

    const createdDocument = await props.repository.create(
      buildFeatureCandidateDraft(featureParent, location)
    );

    setHighlightedDoc(createdDocument);
    props.editDocument(createdDocument.resource.id, KOREAN_FIELDWORK_CATEGORIES.FEATURE);
  };

  const createPenMemoDraft = async () => {
    if (!highlightedDoc || !config?.getCategory(KOREAN_FIELDWORK_CATEGORIES.PEN_MEMO)) return;

    const createdDocument = await props.repository.create({
      resource: {
        identifier: `pen-memo-${Date.now()}`,
        category: KOREAN_FIELDWORK_CATEGORIES.PEN_MEMO,
        relations: {
          depicts: [highlightedDoc.resource.id],
        },
        penMemoStrokes: '[]',
        penMemoTranscriptionStatus: 'pending',
      },
    });

    props.editDocument(createdDocument.resource.id, KOREAN_FIELDWORK_CATEGORIES.PEN_MEMO);
  };

  const createSoilProfilePhotoDraft = async () => {
    if (!highlightedDoc || !canCreateSoilProfilePhoto) return;

    const createdDocument = await props.repository.create(buildSoilProfilePhotoDraft(highlightedDoc));

    props.editDocument(createdDocument.resource.id, KOREAN_FIELDWORK_CATEGORIES.SOIL_PROFILE_PHOTO);
  };

  const createSurveyBoundaryForOperation = async (operationDoc: Document) => {
    if (!location || !config?.getCategory(KOREAN_FIELDWORK_CATEGORIES.SURVEY_BOUNDARY)) return;

    const createdDocument = await props.repository.create(
      buildSurveyBoundaryDraft(operationDoc, location)
    );

    setHighlightedDoc(createdDocument);
    props.editDocument(createdDocument.resource.id, KOREAN_FIELDWORK_CATEGORIES.SURVEY_BOUNDARY);
  };

  const createSurveyBoundaryDraft = async () => {
    if (!highlightedDoc || !canCreateSurveyBoundary) return;

    await createSurveyBoundaryForOperation(highlightedDoc);
  };

  const createPrimarySurveyBoundaryDraft = async () => {
    if (!primaryOperation || !canCreateSurveyBoundaryInPrimaryOperation) return;

    await createSurveyBoundaryForOperation(primaryOperation);
  };

  const updateHighlightedFeatureGeometryState = async (
    featureGeometryEditStatus: string,
    patch: Record<string, unknown> = {}
  ) => {
    if (
      !highlightedDoc ||
      !isKoreanFieldworkChecklistRecord(
        highlightedDoc.resource.category,
        props.investigationModeId
      )
    ) {
      return;
    }

    const updatedDocument = await props.repository.update({
      ...highlightedDoc,
      resource: {
        ...highlightedDoc.resource,
        ...patch,
        featureGeometryEditStatus,
        featureGeometryRevisionHistory: appendGeometryRevisionHistory(
          highlightedDoc,
          featureGeometryEditStatus
        ),
      },
    });

    setHighlightedDoc(updatedDocument);
  };

  const markGeometryNeedsAerialAlignment = async () => {
    await updateHighlightedFeatureGeometryState(
      FEATURE_GEOMETRY_EDIT_STATUS_NEEDS_AERIAL_ALIGNMENT
    );
  };

  const markGeometryAdjustedToAerialLayer = async () => {
    await updateHighlightedFeatureGeometryState(
      FEATURE_GEOMETRY_EDIT_STATUS_ADJUSTED_TO_AERIAL_LAYER,
      {
        geometrySource: GEOMETRY_SOURCE_AERIAL_LAYER_TRACE,
        geometryConfidence: GEOMETRY_CONFIDENCE_AERIAL_ALIGNED,
      }
    );
  };

  const toggleFeatureWorkflowStep = async (stepValue: string) => {
    if (
      !highlightedDoc ||
      !isKoreanFieldworkChecklistRecord(
        highlightedDoc.resource.category,
        props.investigationModeId
      )
    ) {
      return;
    }

    const currentValues = Array.isArray(
      (highlightedDoc.resource as any).featureInvestigationChecklist
    )
      ? (highlightedDoc.resource as any).featureInvestigationChecklist
      : [];
    const nextValues = currentValues.includes(stepValue)
      ? currentValues.filter((value: string) => value !== stepValue)
      : [...currentValues, stepValue];

    const updatedDocument = await props.repository.update({
      ...highlightedDoc,
      resource: {
        ...highlightedDoc.resource,
        featureInvestigationChecklist: nextValues,
      },
    });

    setHighlightedDoc(updatedDocument);
  };

  const onParentIdSelected = (docId: string) => {
    const doc = geoDocuments.find((doc) => doc.resource.id === docId);
    doc && props.selectParent(doc);
  };

  const handleLayoutChange = (event: LayoutChangeEvent) =>
    setScreen(event.nativeEvent.layout);

  return (
    <View style={styles.container} onLayout={handleLayoutChange}>
      {screen && documentToWorldMatrix && screenToWorldMatrix && (
        <GLMap
          setHighlightedDocId={setHighlightedDocFromId}
          highlightedDocId={highlightedDoc?.resource.id}
          screen={screen}
          viewBox={viewBox}
          documentToWorldMatrix={documentToWorldMatrix}
          screenToWorldMatrix={screenToWorldMatrix}
          selectedDocumentIds={props.selectedDocumentIds}
          geoDocuments={geoDocuments}
          location={location}
          updateDoc={updateDoc}
          selectParentId={onParentIdSelected}
          layerDocuments={layerDocuments}
          focusMapOnDocumentId={focusMapOnDocumentId}
        />
      )}
      {shouldShowStartPanel && (
        <View style={styles.startPanel}>
          <Text style={styles.startEyebrow}>디지털 야장</Text>
          <Text style={styles.startTitle}>
            {primaryOperation ? '조사구역 기록 준비' : '조사구역부터 시작'}
          </Text>
          <Text style={styles.startHierarchy}>
            조사 방식에 맞춰 트렌치·유구·피트·토층을 이어갑니다
          </Text>
          <View style={styles.startActions}>
            {!primaryOperation ? (
              <Button
                variant="success"
                title="조사구역 만들기"
                isDisabled={!canCreateOperation}
                onPress={createOperationAndEdit}
              />
            ) : (
              <>
                <Button
                  variant="success"
                  title="트렌치 추가"
                  isDisabled={!canCreateTrench}
                  onPress={createTrenchInPrimaryOperation}
                />
                <Button
                  variant="secondary"
                  title={location ? '조사경계 그리기' : 'GPS 확인 중'}
                  isDisabled={!canCreateSurveyBoundaryInPrimaryOperation}
                  onPress={createPrimarySurveyBoundaryDraft}
                />
                <Button
                  variant="primary"
                  title="조사구역 편집"
                  onPress={editPrimaryOperation}
                />
              </>
            )}
          </View>
        </View>
      )}
      <View style={styles.quickCreateContainer}>
        <Button
          variant="success"
          title={canCreateFeatureCandidate ? '유구 위치 기록' : 'GPS 확인 중'}
          isDisabled={!canCreateFeatureCandidate}
          onPress={createFeatureCandidateAndEdit}
        />
        <Text style={styles.quickCreateHint}>
          현 위치에 유구 점을 찍고 바로 입력합니다.
        </Text>
      </View>
      <MapBottomSheet
        document={highlightedDoc}
        addDocument={props.addDocument}
        editDocument={props.editDocument}
        removeDocument={props.removeDocument}
        focusHandler={focusMapOnDocumentId}
        canCreateLocationCandidate={canCreateFeatureCandidate}
        canCreatePenMemo={!!config?.getCategory(KOREAN_FIELDWORK_CATEGORIES.PEN_MEMO)}
        canCreateSoilProfilePhoto={canCreateSoilProfilePhoto}
        canCreateSurveyBoundary={canCreateSurveyBoundary}
        createFeatureCandidateAtCurrentLocation={createFeatureCandidateAtCurrentLocation}
        createPenMemoDraft={createPenMemoDraft}
        createSoilProfilePhotoDraft={createSoilProfilePhotoDraft}
        createSurveyBoundaryDraft={createSurveyBoundaryDraft}
        markGeometryNeedsAerialAlignment={markGeometryNeedsAerialAlignment}
        markGeometryAdjustedToAerialLayer={markGeometryAdjustedToAerialLayer}
        toggleFeatureWorkflowStep={toggleFeatureWorkflowStep}
        readinessIssues={props.readinessIssues.filter((issue) =>
          issue.documentId === highlightedDoc?.resource.id
        )}
        investigationModeId={props.investigationModeId}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignContent: 'center',
    backgroundColor: '#eef2f4',
    justifyContent: 'center',
  },
  startPanel: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: '#cbd5df',
    borderRadius: 6,
    borderWidth: 1,
    elevation: 8,
    left: 20,
    padding: 16,
    position: 'absolute',
    right: 20,
    top: 20,
    zIndex: 20,
  },
  startEyebrow: {
    color: '#4f6574',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  startTitle: {
    color: '#20313a',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  startHierarchy: {
    color: '#526272',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  startActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCreateContainer: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 190,
    zIndex: 15,
  },
  quickCreateHint: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 4,
    color: '#333',
    fontSize: 11,
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    textAlign: 'center',
  },
});

export default Map;

const getFeatureCandidateParent = (
  highlightedDoc: Document | undefined,
  documents: Document[]
): Document | undefined => {
  if (
    highlightedDoc &&
    FEATURE_CANDIDATE_PARENT_CATEGORIES.includes(highlightedDoc.resource.category)
  ) {
    return highlightedDoc;
  }

  return documents.find(
    (document) => document.resource.category === KOREAN_FIELDWORK_CATEGORIES.OPERATION
  );
};

const appendGeometryRevisionHistory = (
  document: Document,
  status: string
): string => {
  const resource = document.resource as any;
  const previousHistory = parseGeometryRevisionHistory(
    resource.featureGeometryRevisionHistory
  );

  return JSON.stringify([
    ...previousHistory,
    {
      at: new Date().toISOString(),
      status,
      geometry: resource.geometry,
      geometrySource: resource.geometrySource,
      geometryConfidence: resource.geometryConfidence,
      referenceLayerId: resource.featureGeometryReferenceLayerId,
    },
  ]);
};

const parseGeometryRevisionHistory = (history: unknown): unknown[] => {
  if (Array.isArray(history)) return history;
  if (typeof history !== 'string' || history.trim() === '') return [];

  try {
    const parsedHistory = JSON.parse(history);
    return Array.isArray(parsedHistory) ? parsedHistory : [];
  } catch {
    return [];
  }
};
