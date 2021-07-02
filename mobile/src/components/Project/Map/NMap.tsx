import { Document, ProjectConfiguration } from 'idai-field-core';
import React, { useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { DocumentRepository } from '../../../repositories/document-repository';
import { ViewPort } from './geo-svg';
import GLMap from './GLMap';
import MapBottomSheet from './MapBottomSheet';


interface NMapProps {
    repository: DocumentRepository;
    config: ProjectConfiguration;
    selectedDocumentIds: string[];
    languages: string[];
    highlightedDocId?: string;
    addDocument: (parentDoc: Document) => void;
    removeDocument: (doc: Document) => void;
    selectDocument: (doc: Document) => void;
}

const NMap: React.FC<NMapProps> = (props) => {

    const [viewPort, setViewPort] = useState<ViewPort>();
    const [highlightedDoc, setHighlightedDoc] = useState<Document>();


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
                repository={ props.repository }
                config={ props.config }
                viewPort={ viewPort }
                setHighlightedDocId={ setHighlightedDocFromId }
                selectedDocumentIds={ props.selectedDocumentIds } />}
            <MapBottomSheet
                document={ highlightedDoc }
                config={ props.config }
                repository={ props.repository }
                languages={ props.languages }
                addDocument={ props.addDocument }
                removeDocument={ (_highlightedDoc) => {console.log('removeDoc');} }
                focusHandler={ (docId) => console.log(docId) } />
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

export default NMap;