import * as Location from 'expo-location';
import { Document } from 'idai-field-core';
import proj4 from 'proj4';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  LayoutChangeEvent,
  LayoutRectangle,
  StyleSheet,
  View,
} from 'react-native';
import useMapData from '@/hooks/use-mapdata';
import { DocumentRepository } from '@/repositories/document-repository';
import { ConfigurationContext } from '@/contexts/configuration-context';
import GLMap from './GLMap/GLMap';
import {
  createKoreanFieldworkChildRelations,
  createSoilProfilePhotoDraft as buildSoilProfilePhotoDraft,
} from './korean-fieldwork-drafts';
import MapBottomSheet from './MapBottomSheet';

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
  selectedDocumentIds: string[];
  highlightedDocId?: string;
  addDocument: (parentDoc: Document) => void;
  editDocument: (docID: string, categoryName: string) => void;
  removeDocument: (doc: Document) => void;
  selectParent: (doc: Document) => void;
}

const Map: React.FC<MapProps> = (props) => {
  const config = useContext(ConfigurationContext);
  const [screen, setScreen] = useState<LayoutRectangle>();
  const [highlightedDoc, setHighlightedDoc] = useState<Document>();
  const [location, setLocation] = useState<{ x: number; y: number }>();

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
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      // longitude for x and latitude for y
      const p = { x: longitude, y: latitude };
      const newCoords = proj4('EPSG:4326', 'EPSG:3857', p);
      setLocation(newCoords);
    })();
  }, []);

  const canCreateSoilProfilePhoto =
    !!highlightedDoc &&
    !!config?.getCategory('SoilProfilePhoto') &&
    ['Operation', 'Feature', 'FeatureSegment'].includes(highlightedDoc.resource.category);

  const createFeatureCandidateAtCurrentLocation = async () => {
    if (!highlightedDoc || !location || !config?.getCategory('Feature')) return;

    const createdDocument = await props.repository.create({
      resource: {
        identifier: `feature-candidate-${Date.now()}`,
        category: 'Feature',
        relations: createKoreanFieldworkChildRelations(highlightedDoc),
        geometry: {
          type: 'Point',
          coordinates: [location.x, location.y],
        },
        featureRecordingStatus: 'candidate',
        geometrySource: 'gpsApproximate',
        geometryConfidence: 'rough',
      },
    });

    setHighlightedDoc(createdDocument);
  };

  const createPenMemoDraft = async () => {
    if (!highlightedDoc || !config?.getCategory('PenMemo')) return;

    const createdDocument = await props.repository.create({
      resource: {
        identifier: `pen-memo-${Date.now()}`,
        category: 'PenMemo',
        relations: {
          depicts: [highlightedDoc.resource.id],
        },
        penMemoStrokes: '[]',
        penMemoTranscriptionStatus: 'pending',
      },
    });

    props.editDocument(createdDocument.resource.id, 'PenMemo');
  };

  const createSoilProfilePhotoDraft = async () => {
    if (!highlightedDoc || !canCreateSoilProfilePhoto) return;

    const createdDocument = await props.repository.create(buildSoilProfilePhotoDraft(highlightedDoc));

    props.editDocument(createdDocument.resource.id, 'SoilProfilePhoto');
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
      <MapBottomSheet
        document={highlightedDoc}
        addDocument={props.addDocument}
        editDocument={props.editDocument}
        removeDocument={props.removeDocument}
        focusHandler={focusMapOnDocumentId}
        canCreateLocationCandidate={!!location}
        canCreatePenMemo={!!config?.getCategory('PenMemo')}
        canCreateSoilProfilePhoto={canCreateSoilProfilePhoto}
        createFeatureCandidateAtCurrentLocation={createFeatureCandidateAtCurrentLocation}
        createPenMemoDraft={createPenMemoDraft}
        createSoilProfilePhotoDraft={createSoilProfilePhotoDraft}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },
});

export default Map;
