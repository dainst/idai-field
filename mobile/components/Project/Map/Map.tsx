import * as Location from 'expo-location';
import {
  Document,
  KoreanFieldworkReadinessIssue,
} from 'idai-field-core';
import proj4 from 'proj4';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  Alert,
  LayoutChangeEvent,
  LayoutRectangle,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import useMapData from '@/hooks/use-mapdata';
import { DocumentRepository } from '@/repositories/document-repository';
import { ConfigurationContext } from '@/contexts/configuration-context';
import { PreferencesContext } from '@/contexts/preferences-context';
import Button from '@/components/common/Button';
import GLMap from './GLMap/GLMap';
import {
  createFeatureCandidateDraft as buildFeatureCandidateDraft,
  createOperationDraft as buildOperationDraft,
  createSoilProfilePhotoDraft as buildSoilProfilePhotoDraft,
  createSurveyBoundaryDraft as buildSurveyBoundaryDraft,
  MapLocation,
  REFERENCE_BASEMAP_PROVIDER_KAKAO_HYBRID,
  SURVEY_BOUNDARY_ACCURACY_DEFAULT,
  SURVEY_BOUNDARY_SOURCE_DEFAULT,
} from './korean-fieldwork-drafts';
import {
  getKoreanFieldworkMapStartPanelCopy,
} from './korean-fieldwork-map-start-panel';
import {
  getKakaoSatelliteBasemapStatusMessage,
  KAKAO_SATELLITE_BASEMAP_TITLE,
} from './korean-fieldwork-map-provider-status';
import KakaoSatellitePicker, {
  KakaoSatellitePickedLocation,
} from './KakaoSatellitePicker';
import {
  createOperationRelationUpdate,
  getOperationWrapConfirmationMessage,
  getLegacyRootDocumentsForOperation,
  OPERATION_WRAP_CONFIRMATION_TITLE,
} from '../korean-fieldwork-operation-wrap';
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
const DEFAULT_KAKAO_PICKER_LOCATION = {
  latitude: 37.5665,
  longitude: 126.9780,
};
const BOUNDARY_FILE_IMPORT_SYNC_DETAIL =
  'SHP/DXF/CSV는 데스크톱 가져오기에서 불러온 뒤 동기화하면 태블릿 지도에서도 조사 경계로 보입니다. 태블릿에서는 현장에서 GPS 임시 경계나 위성지도 위치를 바로 보태세요.';

const getKakaoSatelliteBoundaryMetadata = () => ({
  boundaryAccuracy: SURVEY_BOUNDARY_ACCURACY_DEFAULT,
  boundarySource: SURVEY_BOUNDARY_SOURCE_DEFAULT,
  referenceBasemapProvider: REFERENCE_BASEMAP_PROVIDER_KAKAO_HYBRID,
});

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
  boundarySummary?: string;
  satellitePickerRequestId?: number;
}

const Map: React.FC<MapProps> = (props) => {
  const config = useContext(ConfigurationContext);
  const preferences = useContext(PreferencesContext);
  const [screen, setScreen] = useState<LayoutRectangle>();
  const [highlightedDoc, setHighlightedDoc] = useState<Document>();
  const [location, setLocation] = useState<MapLocation>();
  const [wgs84Location, setWgs84Location] = useState<KakaoSatellitePickedLocation>();
  const [isKakaoSatellitePickerOpen, setIsKakaoSatellitePickerOpen] = useState(false);
  const currentMapProviderSettings = preferences.preferences.mapProviderSettings;

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
      try {
        const { latitude, longitude } = coords;
        const projected = projectWgs84ToMapLocation({ latitude, longitude });
        if (isMounted) {
          setWgs84Location({ latitude, longitude });
          if (projected) setLocation(projected);
        }
      } catch (error) {
        console.warn('Unable to update map location', error);
      }
    };

    const initializeLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        if (!isMounted) return;
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
      } catch (error) {
        console.warn('Unable to initialize map location', error);
      }
    };

    void initializeLocation();

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
  const legacyRootDocuments = operationDocuments.length === 0
    ? getLegacyRootDocumentsForOperation(props.documents)
    : [];
  const hasLegacyRecordsToWrap = legacyRootDocuments.length > 0;

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
  const shouldShowQuickCreate = !!primaryOperation;
  const hasMeasuredMapScreen =
    !!screen
    && Number.isFinite(screen.width)
    && Number.isFinite(screen.height)
    && screen.width > 0
    && screen.height > 0;
  const shouldRenderInteractiveMap = hasMeasuredMapScreen && !shouldShowStartPanel;
  const canStartSurveyBoundaryFlow =
    canCreateOperation
    && !!location
    && !!config?.getCategory(KOREAN_FIELDWORK_CATEGORIES.SURVEY_BOUNDARY);
  const startPanelCopy = getKoreanFieldworkMapStartPanelCopy({
    hasBoundarySummary: !!props.boundarySummary?.trim(),
    hasLegacyRecordsToWrap,
    hasPrimaryOperation: !!primaryOperation,
    legacyRootDocumentCount: legacyRootDocuments.length,
  });

  const createOperation = async (): Promise<Document | undefined> => {
    if (!canCreateOperation) return undefined;

    const createdDocument = await props.repository.create(buildOperationDraft({
      legacyRootDocumentCount: legacyRootDocuments.length,
      investigationModeId: props.investigationModeId,
      boundarySummary: props.boundarySummary,
    }));
    if (legacyRootDocuments.length > 0) {
      await Promise.all(legacyRootDocuments.map((document) =>
        props.repository.update(createOperationRelationUpdate(
          document,
          createdDocument
        ))));
    }

    setHighlightedDoc(createdDocument);
    return createdDocument;
  };

  const createOperationAndEdit = async () => {
    const createdDocument = await createOperation();
    if (!createdDocument) return;

    props.editDocument(createdDocument.resource.id, KOREAN_FIELDWORK_CATEGORIES.OPERATION);
  };

  const createOperationThenSurveyBoundary = async () => {
    const createdDocument = await createOperation();
    if (!createdDocument) return;

    if (location && config?.getCategory(KOREAN_FIELDWORK_CATEGORIES.SURVEY_BOUNDARY)) {
      await createSurveyBoundaryForOperation(createdDocument, location);
      return;
    }

    props.editDocument(createdDocument.resource.id, KOREAN_FIELDWORK_CATEGORIES.OPERATION);
  };

  const confirmCreateOperationAndEdit = () => {
    if (!hasLegacyRecordsToWrap) {
      void createOperationThenSurveyBoundary();
      return;
    }

    Alert.alert(
      OPERATION_WRAP_CONFIRMATION_TITLE,
      getOperationWrapConfirmationMessage(legacyRootDocuments.length),
      [
        { text: '취소', style: 'cancel' },
        {
          text: '조사 경계 생성',
          onPress: () => { void createOperationThenSurveyBoundary(); },
        },
      ]
    );
  };

  const showBoundaryFileImportInfo = () => {
    Alert.alert(
      'SHP/DXF/CSV 가져오기',
      BOUNDARY_FILE_IMPORT_SYNC_DETAIL,
      [{ text: '확인' }]
    );
  };

  const showSatelliteBasemapInfo = () => {
    if (currentMapProviderSettings.kakaoMapJavaScriptKey.trim()) {
      setIsKakaoSatellitePickerOpen(true);
      return;
    }

    Alert.alert(
      KAKAO_SATELLITE_BASEMAP_TITLE,
      getKakaoSatelliteBasemapStatusMessage(currentMapProviderSettings),
      [{ text: '확인' }]
    );
  };

  useEffect(() => {
    if (!props.satellitePickerRequestId) return;
    showSatelliteBasemapInfo();
  }, [props.satellitePickerRequestId]);

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

  const createSurveyBoundaryForOperation = async (
    operationDoc: Document,
    boundaryLocation: MapLocation,
    boundaryMetadata?: {
      boundaryAccuracy?: string;
      boundarySource?: string;
      referenceBasemapProvider?: string;
    }
  ) => {
    if (!config?.getCategory(KOREAN_FIELDWORK_CATEGORIES.SURVEY_BOUNDARY)) return;

    const createdDocument = await props.repository.create(
      buildSurveyBoundaryDraft(operationDoc, boundaryLocation, props.boundarySummary, boundaryMetadata)
    );

    setHighlightedDoc(createdDocument);
    props.editDocument(createdDocument.resource.id, KOREAN_FIELDWORK_CATEGORIES.SURVEY_BOUNDARY);
  };

  const createSurveyBoundaryDraft = async () => {
    if (!highlightedDoc || !location || !canCreateSurveyBoundary) return;

    await createSurveyBoundaryForOperation(highlightedDoc, location);
  };

  const createPrimarySurveyBoundaryDraft = async () => {
    if (!primaryOperation || !location || !canCreateSurveyBoundaryInPrimaryOperation) return;

    await createSurveyBoundaryForOperation(primaryOperation, location);
  };

  const createSurveyBoundaryFromKakaoSatellite = async (
    pickedLocation: KakaoSatellitePickedLocation
  ) => {
    const projectedLocation = projectWgs84ToMapLocation(pickedLocation);
    if (!projectedLocation) {
      Alert.alert(
        '위성지도 위치',
        '선택한 좌표를 지도 좌표로 변환하지 못했습니다.',
        [{ text: '확인' }]
      );
      return;
    }

    setWgs84Location(pickedLocation);
    setLocation(projectedLocation);
    setIsKakaoSatellitePickerOpen(false);

    if (primaryOperation) {
      await createSurveyBoundaryForOperation(
        primaryOperation,
        projectedLocation,
        getKakaoSatelliteBoundaryMetadata()
      );
      return;
    }

    const createdOperation = await createOperation();
    if (createdOperation) {
      await createSurveyBoundaryForOperation(
        createdOperation,
        projectedLocation,
        getKakaoSatelliteBoundaryMetadata()
      );
    }
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
      <KakaoSatellitePicker
        initialLocation={wgs84Location ?? DEFAULT_KAKAO_PICKER_LOCATION}
        javaScriptKey={currentMapProviderSettings.kakaoMapJavaScriptKey}
        onClose={() => setIsKakaoSatellitePickerOpen(false)}
        onPickLocation={(pickedLocation) => {
          void createSurveyBoundaryFromKakaoSatellite(pickedLocation);
        }}
        visible={isKakaoSatellitePickerOpen}
      />
      {shouldRenderInteractiveMap && documentToWorldMatrix && screenToWorldMatrix && (
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
          <Text style={styles.startEyebrow}>현장 기록</Text>
          <Text style={styles.startTitle}>{startPanelCopy.title}</Text>
          <Text style={styles.startHierarchy}>
            {startPanelCopy.detail}
          </Text>
          <View style={styles.startActions}>
            {!primaryOperation ? (
              <Button
                variant="success"
                title={canStartSurveyBoundaryFlow
                  ? startPanelCopy.primaryActionTitle
                  : 'GPS 확인 중'}
                isDisabled={!canStartSurveyBoundaryFlow}
                onPress={confirmCreateOperationAndEdit}
              />
            ) : (
              <>
                <Button
                  variant="success"
                  title={location ? startPanelCopy.primaryActionTitle : 'GPS 확인 중'}
                  isDisabled={!canCreateSurveyBoundaryInPrimaryOperation}
                  onPress={createPrimarySurveyBoundaryDraft}
                />
                <Button
                  variant="secondary"
                  title="트렌치 추가"
                  isDisabled={!canCreateTrench}
                  onPress={createTrenchInPrimaryOperation}
                />
                <Button
                  variant="primary"
                  title="조사 기본정보"
                  onPress={editPrimaryOperation}
                />
              </>
            )}
            <Button
              variant="secondary"
              title={startPanelCopy.fileImportActionTitle}
              onPress={showBoundaryFileImportInfo}
            />
            <Button
              variant="secondary"
              title={startPanelCopy.satelliteActionTitle}
              onPress={showSatelliteBasemapInfo}
            />
          </View>
        </View>
      )}
      {shouldShowQuickCreate && !shouldShowStartPanel && (
        <View style={styles.quickCreateContainer}>
          <Button
            variant="success"
            title={canCreateFeatureCandidate ? '유구 추가' : 'GPS 확인 중'}
            isDisabled={!canCreateFeatureCandidate}
            onPress={createFeatureCandidateAndEdit}
          />
          <Text style={styles.quickCreateHint}>
            현 위치에 유구 점을 찍고 바로 입력합니다.
          </Text>
          <View style={styles.quickSatelliteAction}>
            <Button
              variant="secondary"
              title="위성지도"
              onPress={showSatelliteBasemapInfo}
            />
          </View>
        </View>
      )}
      {!shouldShowStartPanel && (
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
          openSatellitePicker={showSatelliteBasemapInfo}
          markGeometryNeedsAerialAlignment={markGeometryNeedsAerialAlignment}
          markGeometryAdjustedToAerialLayer={markGeometryAdjustedToAerialLayer}
          toggleFeatureWorkflowStep={toggleFeatureWorkflowStep}
          readinessIssues={props.readinessIssues.filter((issue) =>
            issue.documentId === highlightedDoc?.resource.id
          )}
          investigationModeId={props.investigationModeId}
        />
      )}
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
    backgroundColor: '#fff',
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
  quickSatelliteAction: {
    marginTop: 6,
  },
});

export default Map;

const projectWgs84ToMapLocation = (
  location: KakaoSatellitePickedLocation
): MapLocation | undefined => {
  if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
    return undefined;
  }

  const projected = proj4('EPSG:4326', 'EPSG:3857', {
    x: location.longitude,
    y: location.latitude,
  });
  if (!Number.isFinite(projected.x) || !Number.isFinite(projected.y)) {
    return undefined;
  }

  return projected;
};

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
