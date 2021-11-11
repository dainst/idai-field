import { Document, FieldGeometry, Query } from 'idai-field-core';
import { useCallback, useEffect, useState } from 'react';
import { LayoutRectangle } from 'react-native';
import { Matrix4 } from 'react-native-redash';
import {
    defineWorldCoordinateSystem, GeometryBoundings, getDocumentToWorldTransform,
    getDocumentToWorldTransformMatrix, getGeometryBoundings, getMinMaxGeometryCoords,
    getScreenToWorldTransformationMatrix, processTransform2d, Transformation
} from '../components/Project/Map/GLMap/cs-transform';
import { DocumentRepository } from '../repositories/document-repository';
import { viewBoxPaddingX, viewBoxPaddingY } from './../components/Project/Map/GLMap/constants';


const searchQuery: Query = {
    q: '*',
    constraints: { 'geometry:exist': 'KNOWN' }
};

export type UpdatedDocument = {
    document: Document,
    status: 'updated' | 'deleted'
};

type mapDataReturn = [
    Document[],
    Matrix4 | undefined,
    Matrix4 | undefined,
    Transformation | undefined, (docId: string) => void,
    UpdatedDocument | undefined];


const useMapData = (repository: DocumentRepository, selectedDocumentIds: string[], screen?: LayoutRectangle):
    mapDataReturn => {

    const [geoDocuments, setGeoDocuments] = useState<Document[]>([]);
    const [geometryBoundings, setGeometryBoundings] = useState<GeometryBoundings | null>(null);
    const [documentToWorldMatrix, setDocumentToWorldMatrix] = useState<Matrix4>();
    const [screenToWorldMatrix, setScreenToWorldMatrix] = useState<Matrix4>();
    const [viewBox, setViewBox] = useState<Transformation>();
    const [updateDoc, setUpdateDoc] = useState<UpdatedDocument>();
   
    const focusMapOnDocumentIds = useCallback(async (docIds: string[]) => {

        if(!documentToWorldMatrix) return;
        
        const geoDocs: FieldGeometry[] = [];
        const docs = await repository.getMultiple(docIds);
        docs.forEach(doc => doc.resource.geometry && geoDocs.push(doc.resource.geometry));
        
        if(!geoDocs.length) return;
        const { minX, minY, maxX, maxY } = getMinMaxGeometryCoords(geoDocs);
        const [left, bottom] = processTransform2d(documentToWorldMatrix, [minX,minY]);
        const [right, top] = processTransform2d(documentToWorldMatrix, [maxX,maxY]);
        setViewBox(getDocumentToWorldTransform({
            minX: left,
            minY: bottom,
            height: Math.max(top - bottom,right - left) + viewBoxPaddingY,
            width: Math.max(top - bottom,right - left) + viewBoxPaddingX,
        },defineWorldCoordinateSystem()));
    },[repository,documentToWorldMatrix]);

    const focusMapOnDocumentId = (docId: string) => focusMapOnDocumentIds([docId]);


    useEffect(() => {

        repository.find(searchQuery)
            .then(result => {
                setGeoDocuments(result.documents);
                setGeometryBoundings(getGeometryBoundings(result.documents));
            }).catch(err => console.log('Document not found. Error:',err));

        const changedSubscription = repository.remoteChanged()
            .subscribe(document => Document.hasGeometry(document) && setUpdateDoc({ document, status: 'updated' }));

        return () => changedSubscription.unsubscribe();
    },[repository]);

    useEffect(() => {

        const deletedSubscription = repository.deleted()
            .subscribe(document => setUpdateDoc({ document, status: 'deleted' }));
        return () => deletedSubscription.unsubscribe();
    },[repository]);


    useEffect(() => setDocumentToWorldMatrix( getDocumentToWorldTransformMatrix(geometryBoundings)),
        [geometryBoundings]);


    useEffect(() => {focusMapOnDocumentIds(selectedDocumentIds);},[selectedDocumentIds, focusMapOnDocumentIds]);

    useEffect(() => {
        
        if(!screen) return;
        setScreenToWorldMatrix(getScreenToWorldTransformationMatrix(screen));
    },[screen]);


    return [geoDocuments, documentToWorldMatrix, screenToWorldMatrix, viewBox, focusMapOnDocumentId, updateDoc];
};


export default useMapData;