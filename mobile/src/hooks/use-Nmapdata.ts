import { Document, Query } from 'idai-field-core';
import { useEffect, useState } from 'react';
import { Matrix4 } from 'react-native-redash';
import {
    GeometryBoundings, getGeometryBoundings,
    setupTransformationMatrix, ViewPort
} from '../components/Project/Map/geo-svg';
import { DocumentRepository } from '../repositories/document-repository';

const searchQuery: Query = {
    q: '*',
    constraints: { 'geometry:exist': 'KNOWN' }
};

const useMapData = (
        repository: DocumentRepository,
        viewPort: ViewPort): [Document[] , Matrix4 | undefined] => {

    const [geoDocuments, setGeoDocuments] = useState<Document[]>([]);
    const [geometryBoundings, setGeometryBoundings] = useState<GeometryBoundings | null>(null);
    const [transformMatrix, setTransformMatrix] = useState<Matrix4>();

    
    useEffect(() => {

        repository.find(searchQuery)
            .then(result => {
                setGeoDocuments(result.documents);
                setGeometryBoundings(getGeometryBoundings(result.documents));
            }).catch(err => console.log('Document not found. Error:',err));
    },[repository]);


    useEffect(() => setTransformMatrix( setupTransformationMatrix(geometryBoundings,viewPort)),
        [geometryBoundings, viewPort]);


    return [geoDocuments, transformMatrix];
};


export default useMapData;