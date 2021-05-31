/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Document, Query } from 'idai-field-core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { identityMatrix4, Matrix4 } from 'react-native-redash';
import {
    GeometryBoundings,
    getGeometryBoundings,
    getMinMaxCoords, setupTransformationMatrix,
    ViewPort
} from '../components/Project/Map/geo-svg';
import { viewBoxPaddingX, viewBoxPaddingY } from '../components/Project/Map/geo-svg/constants';
import { GeoMap, setupGeoMap } from '../components/Project/Map/geometry-map/geometry-map';
import { DocumentRepository } from '../repositories/document-repository';
import usePrevious from './use-previous';


const useMapData = (repository: DocumentRepository, viewPort: ViewPort | undefined, selectedDocIds: string[]):
    [string[] | undefined, GeoMap | null, Matrix4 | undefined, number[] | undefined] => {
    
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
            return Array.from(documentsGeoMap?.keys()).sort((a,b) => {
                if(documentsGeoMap!.get(a)!.area > documentsGeoMap!.get(b)!.area) return -1;
                else if(documentsGeoMap!.get(a)!.area < documentsGeoMap!.get(b)!.area) return 1;
                else return 0;
            });
        }
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
                for(const id of previousSelectedDocIds){
                    documentsGeoMap.get(id)!.isSelected = false;
                }
            }

            for(const id of selectedDocIds){
                documentsGeoMap.get(id)!.isSelected = true;
            }
            setDocIds(sortDocIdsByArea());
        }

    }, [previousSelectedDocIds, selectedDocIds, documentsGeoMap, sortDocIdsByArea]);
    

    useEffect(() => {
        //compute viewBox

        if(viewPort && documentsGeoMap){
            if(!selectedDocIds.length) setViewBox([viewPort.x,viewPort.y,viewPort.width, viewPort.height]);
            else {
                const { minX, minY, maxX, maxY } = getMinMaxCoords(selectedDocIds.map(docId => ({
                    type: documentsGeoMap.get(docId)!.doc.resource.geometry.type,
                    coordinates: documentsGeoMap.get(docId)!.transformedCoords
                })));
                setViewBox([
                    minX - viewBoxPaddingX,
                    minY - viewBoxPaddingY,
                    maxX - minX + 2 * viewBoxPaddingX,
                    maxY - minY + 2 * viewBoxPaddingY]);
            }
        }
    },[selectedDocIds, viewPort, documentsGeoMap]);

    return [
        docIds,
        documentsGeoMap,
        transformMatrix,
        viewBox
    ];
    
};


export default useMapData;