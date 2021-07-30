import { Document, ProjectConfiguration } from 'idai-field-core';
import React, { useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import useMapData from '../../../hooks/use-mapdata';
import { DocumentRepository } from '../../../repositories/document-repository';
import { ViewPort } from './GLMap/geojson';
import GLMap from './GLMap/GLMap';
import MapBottomSheet from './MapBottomSheet';


interface NMapProps {
    repository: DocumentRepository;
    config: ProjectConfiguration;
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
    
    
    const handleLayoutChange = (event: LayoutChangeEvent) => setViewPort(event.nativeEvent.layout);

    
    return (
        <View style={ styles.container } onLayout={ handleLayoutChange }>

            {(viewPort) && <GLMap
                config={ props.config }
                setHighlightedDocId={ setHighlightedDocFromId }
                viewPort={ viewPort }
                cameraView={ cameraView }
                transformMatrix={ transformMatrix }
                selectedDocumentIds={ props.selectedDocumentIds }
                geoDocuments={ geoDocuments } />}
            <MapBottomSheet
                document={ highlightedDoc }
                config={ props.config }
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
