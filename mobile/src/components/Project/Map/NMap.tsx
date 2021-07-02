import { Document, ProjectConfiguration, Query } from 'idai-field-core';
import React, { useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import useToast from '../../../hooks/use-toast';
import { DocumentRepository } from '../../../repositories/document-repository';
import { ToastType } from '../../common/Toast/ToastProvider';
import { GeometryBoundings, getGeometryBoundings, ViewPort } from './geo-svg';
import GLMap from './GLMap';
import MapBottomSheet from './MapBottomSheet';

const searchQuery: Query = {
    q: '*',
    constraints: { 'geometry:exist': 'KNOWN' }
};

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
    const [allDocs, setAllDocs] = useState<Document[]>([]);
    const [geoBounds, setGeoBounds] = useState<GeometryBoundings | null>(null);
    const [highlightedDoc, setHighlightedDoc] = useState<Document>();


    const { showToast } = useToast();


    const setHighlightedDocFromId = useCallback((docId: string) =>
        props.repository.get(docId).then(setHighlightedDoc), [props.repository]);

    useEffect(() => {

        if (!props.highlightedDocId) return;
        setHighlightedDocFromId(props.highlightedDocId);
    }, [props.highlightedDocId, setHighlightedDocFromId]);
    
    
    useEffect(() => {
        props.repository.find(searchQuery)
            .then(result => {
                setAllDocs(result.documents);
                setGeoBounds(getGeometryBoundings(result.documents));
            })
            .catch(err => showToast(ToastType.Error,`${err}`));
    },[props.repository, showToast]);


    const handleLayoutChange = (event: LayoutChangeEvent) => setViewPort(event.nativeEvent.layout);

    
    return (
        <View style={ styles.container } onLayout={ handleLayoutChange }>

            {(geoBounds && allDocs && viewPort) &&
                <GLMap
                    allDocs={ allDocs }
                    geoBoundings={ geoBounds }
                    viewPort={ viewPort }
                    config={ props.config }
                    setHighlightedDocId={ setHighlightedDocFromId } />}
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