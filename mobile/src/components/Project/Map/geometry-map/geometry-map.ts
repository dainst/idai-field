import { Position } from 'geojson';
import { Document, FieldGeometryType } from 'idai-field-core';
import { identityMatrix4, Matrix4 } from 'react-native-redash';
import {
    getGeometryArea, isLineStringInMultiPolygon,
    isLineStringInPolygon,
    isMultiLineStringInMultiPolygon,
    isMultiLineStringInPolygon,
    isMultiPointInMultiPolygon,
    isMultiPointInPolygon,
    isMultiPolygonInMultipolygon,
    isMultiPolygonInPolygon,
    isPointInMultiPolygon,
    isPointInPolygon,
    isPolygonInMultiPolygon,
    isPolygonInPolygon,

    transformDocumentsGeometry,
    TransformedDocument
} from '../geo-svg';

export interface GeoMapEntry {
    parents: string[];
    transformedCoords: Position | Position[] | Position[][] | Position[][][];
    doc: Document;
    area: number;
    isSelected?: boolean;
}


export type GeoMap = Map<string, GeoMapEntry>;


export const setupGeoMap = (
    geoDocuments: Document[] | undefined,
    transformationMatrix: Matrix4 | undefined): GeoMap | null=> {
    
    if(!transformationMatrix ||
        !geoDocuments ||
        !geoDocuments.length ||
        JSON.stringify(transformationMatrix) === JSON.stringify(identityMatrix4)) return null;

    //transform geometries to screen cs
    const transformedGeos = transformDocumentsGeometry(transformationMatrix, geoDocuments);

    //construct geoMap datastructure
    const geoMap: Map<string, GeoMapEntry> = new Map();
    for(const doc of transformedGeos){
        geoMap.set(doc.doc.resource.id,{
            transformedCoords: doc.transformedCoordinates,
            parents: findParentDocIds(doc, transformedGeos),
            doc: doc.doc,
            area: getGeometryArea({
                type: doc.doc.resource.geometry.type,
                coordinates: doc.transformedCoordinates
            })
        });
    }

    return geoMap;
};


const findParentDocIds = (checkDoc: TransformedDocument, transformedGeoDocuments: TransformedDocument[]): string[] => {
    
    const toCheckGeoType = checkDoc.doc.resource.geometry.type as FieldGeometryType;
    const toCeckDocCoords = checkDoc.transformedCoordinates;
    const parentArray: {id: string, area: number}[] = [];

    for(const doc of transformedGeoDocuments){

        const geoType = doc.doc.resource.geometry.type as FieldGeometryType;
        if(doc.doc.resource.id === checkDoc.doc.resource.id ) continue;
        if(geoType === 'Point' || geoType === 'MultiPoint' || geoType === 'LineString' || geoType === 'MultiLineString')
            continue;

        const coords = doc.transformedCoordinates;
        const addParent = () => parentArray.push({
            id: doc.doc.resource.id,
            area: getGeometryArea(
                {
                    type: doc.doc.resource.geometry.type,
                    coordinates: coords
                }
                ) });
        

        switch(toCheckGeoType){
            case 'Point':
                if(geoType === 'Polygon')
                    isPointInPolygon(toCeckDocCoords as Position, coords as Position[][]) && addParent();
                else
                    isPointInMultiPolygon(toCeckDocCoords as Position, coords as Position[][][]) && addParent();
                break;
            case 'MultiPoint':
                if(geoType === 'Polygon')
                    isMultiPointInPolygon(toCeckDocCoords as Position[], coords as Position[][]) && addParent();
                else
                    isMultiPointInMultiPolygon(toCeckDocCoords as Position[], coords as Position[][][]) && addParent();
                break;
            case 'LineString':
                if(geoType === 'Polygon')
                    isLineStringInPolygon(toCeckDocCoords as Position[], coords as Position[][]) && addParent();
                else
                    isLineStringInMultiPolygon(toCeckDocCoords as Position[], coords as Position[][][]) && addParent();
                break;
            case 'MultiLineString':
                if(geoType === 'Polygon')
                    isMultiLineStringInPolygon(toCeckDocCoords as Position[][], coords as Position[][]) && addParent();
                else {
                    isMultiLineStringInMultiPolygon(toCeckDocCoords as Position[][], coords as Position[][][]) &&
                        addParent();
                }
                break;
            case 'Polygon':
                if(geoType === 'Polygon')
                    isPolygonInPolygon(toCeckDocCoords as Position[][], coords as Position[][]) && addParent();
                else
                    isPolygonInMultiPolygon(toCeckDocCoords as Position[][], coords as Position[][][]) && addParent();
                break;
            case 'MultiPolygon':
                if(geoType === 'Polygon')
                    isMultiPolygonInPolygon(toCeckDocCoords as Position[][][], coords as Position[][]) && addParent();
                else {
                    isMultiPolygonInMultipolygon(toCeckDocCoords as Position[][][], coords as Position[][][]) &&
                        addParent();
                }
                break;
        }
    }

    parentArray.sort((a,b) => {
        if(a.area > b.area) return 1;
        else if(a.area < b.area) return -1;
        else return 0;
    });
    return parentArray.map(entry => entry.id);

};

export const setGeoMapEntry = <T extends keyof GeoMapEntry>(
            geoMap: GeoMap | undefined,
            key: string, entry: T,
            value: GeoMapEntry[T]): void => {

    if(!geoMap) return;
    const mapEntry = geoMap.get(key);
    if(mapEntry) geoMap.set(key,{ ...mapEntry, [entry]: value });
};


export const getGeoMapArea = (geoMap: GeoMap | undefined, key: string): GeoMapEntry['area'] =>
    getGeoMapEntry(geoMap, key, 'area') || 0;


export const getGeoMapCoords = (geoMap: GeoMap | undefined, key: string): GeoMapEntry['transformedCoords'] =>
    getGeoMapEntry(geoMap, key,'transformedCoords') || [];


export const getGeoMapIsSelected = (geoMap: GeoMap | undefined, key: string): GeoMapEntry['isSelected'] =>
    getGeoMapEntry(geoMap, key, 'isSelected');


export const getGeoMapDoc = (geoMap: GeoMap, key: string): GeoMapEntry['doc'] | undefined =>
    getGeoMapEntry(geoMap, key, 'doc');


export const getGeoMapParents = (geoMap: GeoMap, key: string): GeoMapEntry['parents'] =>
    getGeoMapEntry(geoMap,key, 'parents') || [];


const getGeoMapEntry = <T extends keyof GeoMapEntry>(geoMap: GeoMap | undefined, key: string, entry: T) => {
    
    if(!geoMap) return;
        const mapEntry = geoMap.get(key);
        if(mapEntry) return mapEntry[entry];
};