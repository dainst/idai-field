import { Document, FieldGeometry, Query } from 'idai-field-core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { identityMatrix4, Matrix4 } from 'react-native-redash';
import {
    GeometryBoundings,
    getGeometryBoundings,
    getMinMaxCoords, setupTransformationMatrix,
    ViewPort
} from '../components/Project/Map/geo-svg';
import { viewBoxPaddingX, viewBoxPaddingY } from '../components/Project/Map/geo-svg/constants';
import {
    GeoMap,
    getGeoMapArea, getGeoMapCoords,
    getGeoMapDoc,
    setGeoMapEntry, setupGeoMap
} from '../components/Project/Map/geometry-map/geometry-map';
import { DocumentRepository } from '../repositories/document-repository';
import usePrevious from './use-previous';


const useMapData = (repository: DocumentRepository, viewPort: ViewPort | undefined, selectedDocIds: string[]):
    [string[] | undefined, GeoMap | null, Matrix4 | undefined, number[] | undefined, (docId: string) => void ] => {
    
    const [transformMatrix, setTransformMatrix] = useState<Matrix4>(identityMatrix4);
    const [geoDocuments, setGeoDocuments] = useState<Document[]>();
    const [geometryBoundings, setGeometryBoundings] = useState<GeometryBoundings | null>(null);
    const [viewBox, setViewBox] = useState<number[]>();

    const [documentsGeoMap, setDocumentsGeoMap] = useState<GeoMap | null>(null);
    const [docIds, setDocIds] = useState<string[]>();

    const searchQuery: Query = useMemo(() => ({
        q: '*',
        constraints: { 'geometry:exist': 'KNOWN' }
    }),[]);

    const previousSelectedDocIds = usePrevious(selectedDocIds);

    const sortDocIdsByArea = useCallback(() => {

        if(documentsGeoMap){
            return Array.from(documentsGeoMap.keys()).sort((docAId,docBId) => {
                const areaA = getGeoMapArea(documentsGeoMap, docAId);
                const areaB = getGeoMapArea(documentsGeoMap, docBId);
                if(areaA > areaB) return -1;
                else if(areaA < areaB) return 1;
                else return 0;
            });
        }
    },[documentsGeoMap]);


    const focusMapOnDocumentIds = useCallback((docIds: string[]) => {

        //compute and set viewBox
        if(!documentsGeoMap) return;
        const fieldGeometries = docIds.map(docId => {
            const doc = getGeoMapDoc(documentsGeoMap, docId);
            if(doc)
                return {
                    type: doc.resource.geometry.type,
                    coordinates: getGeoMapCoords(documentsGeoMap,docId)
                } as FieldGeometry;
            return null;
        }).filter(doc => doc !== null) as FieldGeometry[];
        
        const { minX, minY, maxX, maxY } = getMinMaxCoords(fieldGeometries);
        setViewBox([
            minX - viewBoxPaddingX,
            minY - viewBoxPaddingY,
            maxX - minX + 2 * viewBoxPaddingX,
            maxY - minY + 2 * viewBoxPaddingY]);
    },[documentsGeoMap]);

    
    useEffect(() => {

        repository.find(searchQuery)
            .then(result => {
                setGeoDocuments(result.documents);
                setGeometryBoundings(getGeometryBoundings(result.documents));
            });
    },[searchQuery, repository]);


    useEffect(() => {

        if(viewPort) setTransformMatrix(setupTransformationMatrix(geometryBoundings, viewPort));
    },[viewPort, geometryBoundings]);


    useEffect(() => {

        setDocumentsGeoMap(setupGeoMap(geoDocuments, transformMatrix));

    },[geoDocuments, transformMatrix]);


    useEffect(() => {

        //set previously selected docs as not selected
        if(documentsGeoMap){
            if(previousSelectedDocIds){
                previousSelectedDocIds.forEach(id => setGeoMapEntry(documentsGeoMap,id,'isSelected',false));
            }
            selectedDocIds.forEach(id => setGeoMapEntry(documentsGeoMap,id,'isSelected',true));
            setDocIds(sortDocIdsByArea());
        }

    }, [previousSelectedDocIds, selectedDocIds, documentsGeoMap, sortDocIdsByArea]);
    

    useEffect(() => {

        if(viewPort){
            if(!selectedDocIds.length) setViewBox([viewPort.x,viewPort.y,viewPort.width, viewPort.height]);
            else {
                focusMapOnDocumentIds(selectedDocIds);
            }
        }
    },[selectedDocIds, viewPort, focusMapOnDocumentIds]);


    const focusMapOnDocumentId = (docId: string): void => {
        
        if(!documentsGeoMap || !documentsGeoMap.has(docId)) return;
        focusMapOnDocumentIds([docId]);

    };
    

    return [
        docIds,
        documentsGeoMap,
        transformMatrix,
        viewBox,
        focusMapOnDocumentId
    ];
    
};


export default useMapData;