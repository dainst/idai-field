/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Document, Query } from 'idai-field-core';
import { useEffect, useRef, useState } from 'react';
import { Matrix4 } from 'react-native-redash';
import {
    GeometryBoundings,
    getGeometryBoundings,
    setupTransformationMatrix,
    ViewPort
} from '../components/Project/Map/geo-svg';
import { GeoMap, setupGeoMap } from '../components/Project/Map/geometry-map/geometry-map';
import { DocumentRepository } from '../repositories/document-repository';
import usePrevious from './use-previous';


const useMapData = (repository: DocumentRepository, viewPort: ViewPort, selectedDocIds: string[]):
    [string[] | undefined, GeoMap | null, Matrix4 | undefined] => {
    
    const [transformMatrix, setTransformMatrix] = useState<Matrix4>();
    const [geoDocuments, setGeoDocuments] = useState<Document[]>();
    const [geometryBoundings, setGeometryBoundings] = useState<GeometryBoundings | null>(null);

    const documentsGeoMap = useRef<GeoMap | null>(null);
    const [docIds, setDocIds] = useState<string[]>();

    const searchQuery: Query = {
        q: '*',
        constraints: { 'geometry:exist': 'KNOWN' }
    };

    const previousSelectedDocIds = usePrevious(selectedDocIds);
    
    useEffect(() => {
        repository.find(searchQuery)
            .then(result => {
                setGeoDocuments(result.documents);
                setGeometryBoundings(getGeometryBoundings(result.documents));
            });
    });


    useEffect(() => {

        setTransformMatrix(setupTransformationMatrix(geometryBoundings, viewPort));
    },[viewPort, geometryBoundings]);


    useEffect(() => {

        documentsGeoMap.current = setupGeoMap(geoDocuments, transformMatrix);
        setDocIds(sortDocIdsByArea());
    },[geoDocuments, transformMatrix]);

    useEffect(() => {

        //set previously selected docs as not selected
        if(previousSelectedDocIds){
            for(const id of previousSelectedDocIds){
                documentsGeoMap.current!.get(id)!.isSelected = false;
            }
        }

        for(const id of selectedDocIds){
            documentsGeoMap.current!.get(id)!.isSelected = true;
        }
        setDocIds(sortDocIdsByArea());

    }, [previousSelectedDocIds, selectedDocIds]);


    const sortDocIdsByArea = () => {

        if(documentsGeoMap.current){
            return Array.from(documentsGeoMap.current?.keys()).sort((a,b) => {
                if(documentsGeoMap.current!.get(a)!.area > documentsGeoMap.current!.get(b)!.area) return -1;
                else if(documentsGeoMap.current!.get(a)!.area < documentsGeoMap.current!.get(b)!.area) return 1;
                else return 0;
            });
        }
    };

    return [
        docIds,
        documentsGeoMap.current,
        transformMatrix
    ];
    
};

export default useMapData;