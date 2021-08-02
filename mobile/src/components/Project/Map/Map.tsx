import { Document } from 'idai-field-core';
import React, { useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import useMapData from '../../../hooks/use-mapdata';
import { DocumentRepository } from '../../../repositories/document-repository';
import { ViewPort } from './GLMap/geojson';
import GLMap from './GLMap/GLMap';
import MapBottomSheet from './MapBottomSheet';
import * as Location from 'expo-location';
import proj4 from "proj4";

proj4.defs('WGS84', "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees");


interface NMapProps {
    repository: DocumentRepository;
    selectedDocumentIds: string[];
    highlightedDocId?: string;
    addDocument: (parentDoc: Document) => void;
    removeDocument: (doc: Document) => void;
    selectDocument: (doc: Document) => void;
}


const Map: React.FC<NMapProps> = (props) => {

    const [viewPort, setViewPort] = useState<ViewPort>();
    const [highlightedDoc, setHighlightedDoc] = useState<Document>();
    
    const [
        geoDocuments,
        transformMatrix,
        cameraView,
        focusMapOnDocumentId] = useMapData(props.repository,viewPort,props.selectedDocumentIds);

    const setHighlightedDocFromId = useCallback((docId: string) =>
        props.repository.get(docId).then(setHighlightedDoc), [props.repository]);

    useEffect(() => {

        if (!props.highlightedDocId) return;
        setHighlightedDocFromId(props.highlightedDocId);
    }, [props.highlightedDocId, setHighlightedDocFromId]);
    
    useEffect(() => {
        (async () => {
          let { status } = await Location.requestPermissionsAsync();
          if (status !== 'granted') {
            console.log('Permission to access location was denied');
            return;
          }
    
          let location = await Location.getCurrentPositionAsync({});
          const lat = location.coords.latitude;
          const lon = location.coords.longitude;
          const new_cords = proj4("+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs", "+proj=utm +zone=32 +ellps=WGS84 +datum=WGS84 +units=m +no_defs", [lat,lon]);
        })();
      }, []);
    



    
    const handleLayoutChange = (event: LayoutChangeEvent) => setViewPort(event.nativeEvent.layout);


    return (
        <View style={ styles.container } onLayout={ handleLayoutChange }>

            {(viewPort) && <GLMap
                setHighlightedDocId={ setHighlightedDocFromId }
                viewPort={ viewPort }
                cameraView={ cameraView }
                transformMatrix={ transformMatrix }
                selectedDocumentIds={ props.selectedDocumentIds }
                geoDocuments={ geoDocuments } />}
            <MapBottomSheet
                document={ highlightedDoc }
                repository={ props.repository }
                addDocument={ props.addDocument }
                removeDocument={ props.removeDocument }
                focusHandler={ focusMapOnDocumentId } />
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignContent: 'center',
        justifyContent: 'center',
    }
});

export default Map;
