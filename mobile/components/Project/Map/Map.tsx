import * as Location from 'expo-location';
import { Document } from 'idai-field-core';
import proj4 from 'proj4';
import React, { useCallback, useEffect, useState } from 'react';
import {
  LayoutChangeEvent,
  LayoutRectangle,
  StyleSheet,
  View,
} from 'react-native';
import useMapData from '@/hooks/use-mapdata';
import { DocumentRepository } from '@/repositories/document-repository';
import GLMap from './GLMap/GLMap';
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
      const { status } = await Location.requestBackgroundPermissionsAsync();
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
      console.log(p);
    })();
  }, []);

  const onParentIdSelected = (docId: string) => {
    const doc = geoDocuments.find((doc) => doc.resource.id === docId);
    doc && props.selectParent(doc);
  };

  const handleLayoutChange = (event: LayoutChangeEvent) =>
    setScreen(event.nativeEvent.layout);

  return (
    <View style={styles.container} onLayout={handleLayoutChange}>
      {/* {screen && documentToWorldMatrix && screenToWorldMatrix && (
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
      )} */}
      <MapBottomSheet
        document={highlightedDoc}
        addDocument={props.addDocument}
        editDocument={props.editDocument}
        removeDocument={props.removeDocument}
        focusHandler={focusMapOnDocumentId}
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
