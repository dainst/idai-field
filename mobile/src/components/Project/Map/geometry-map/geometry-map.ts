import { Position } from 'geojson';
import { Document, FieldGeometryType } from 'idai-field-core';
import { Matrix4 } from 'react-native-redash';
import {
    getGeometryBoundings, isLineStringInMultiPolygon,
    isLineStringInPolygon, isMultiLineStringInMultiPolygon,
    isMultiLineStringInPolygon, isMultiPointInMultiPolygon,
    isMultiPointInPolygon, isMultiPolygonInMultipolygon,
    isMultiPolygonInPolygon, isPointInMultiPolygon, isPointInPolygon,
    isPolygonInMultiPolygon,
    isPolygonInPolygon,
    setupTransformationMatrix, sortDocumentByGeometryArea,
    transformDocumentsGeometry,
    TransformedDocument
} from '../geo-svg';
import { ViewPort } from '../geo-svg/geojson-cs-to-svg-cs/viewport-utils/viewport-utils';

export interface GeoMapEntry {
    childs: string[];
    transformedCoords: Position | Position[] | Position[][] | Position[][][];
    doc: Document;
    isSelected?: boolean;
    isHighlighted?: boolean;
}

export type GeoMap = Map<string, GeoMapEntry>;

export interface RenderingData {
    geoMap?: GeoMap
    transformationMatrix?: Matrix4
}

export const setupGeoMap = (geoDocuments: Document[], viewPort: ViewPort | undefined): RenderingData => {
    
    if(!viewPort || !geoDocuments.length) return {};

    const geometryBoundings = getGeometryBoundings(geoDocuments);
    const transformationMatrix = setupTransformationMatrix(geometryBoundings, viewPort);

    //transform geometries to screen cs
    const transformedGeo = transformDocumentsGeometry(transformationMatrix, geoDocuments);
    const sortedGeo = sortDocumentByGeometryArea(transformedGeo);

    //construct geoMap datastructure
    const geoMap: Map<string, GeoMapEntry> = new Map();
    for(const doc of sortedGeo){
        geoMap.set(doc.doc.resource.id,{
            transformedCoords: doc.transformedCoordinates,
            childs: findChildDocIds(doc, transformedGeo),
            doc: doc.doc
        });
    }

    return {
        geoMap,
        transformationMatrix
    };
};


const findChildDocIds = (document: TransformedDocument, transformedGeoDocuments: TransformedDocument[]): string[] => {
    
    const geoType = document.doc.resource.geometry.type as FieldGeometryType;
    const docPolygon = document.transformedCoordinates;
    if(geoType === 'Point' || geoType === 'MultiPoint' || geoType === 'LineString' || geoType === 'MultiLineString')
        return [];

    const childArray: string[] = [];

    for(const doc of transformedGeoDocuments){
        if(doc.doc.resource.id === document.doc.resource.id ) continue;
        const addChild = () => childArray.push(doc.doc.resource.id);
        const coords = doc.transformedCoordinates;
        switch(doc.doc.resource.geometry.type as FieldGeometryType){
            case 'Point':
                if(geoType === 'Polygon')
                    isPointInPolygon(coords as Position, docPolygon as Position[][]) && addChild();
                else
                    isPointInMultiPolygon(coords as Position, docPolygon as Position[][][]) && addChild();
                break;
            case 'MultiPoint':
                if(geoType === 'Polygon')
                    isMultiPointInPolygon(coords as Position[], docPolygon as Position[][]) && addChild();
                else
                    isMultiPointInMultiPolygon(coords as Position[], docPolygon as Position[][][]) && addChild();
                break;
            case 'LineString':
                if(geoType === 'Polygon')
                    isLineStringInPolygon(coords as Position[], docPolygon as Position[][]) && addChild();
                else
                    isLineStringInMultiPolygon(coords as Position[], docPolygon as Position[][][]) && addChild();
                break;
            case 'MultiLineString':
                if(geoType === 'Polygon')
                    isMultiLineStringInPolygon(coords as Position[][], docPolygon as Position[][]) && addChild();
                else
                    isMultiLineStringInMultiPolygon(coords as Position[][], docPolygon as Position[][][]) && addChild();
                break;
            case 'Polygon':
                if(geoType === 'Polygon')
                    isPolygonInPolygon(coords as Position[][], docPolygon as Position[][]) && addChild();
                else
                    isPolygonInMultiPolygon(coords as Position[][], docPolygon as Position[][][]) && addChild();
                break;
            case 'MultiPolygon':
                if(geoType === 'Polygon')
                    isMultiPolygonInPolygon(coords as Position[][][], docPolygon as Position[][]) && addChild();
                else
                    isMultiPolygonInMultipolygon(coords as Position[][][], docPolygon as Position[][][]) && addChild();
                break;
        }
    }

    return childArray;

};

// const isPointInPolygon = (
//     point: Position, polygon: Position[][] | Position[][][],
//     type: 'Polygon' |'MultiPolygon') => {

//         if(type === 'Polygon')
//             return isPointInPolygon(point, polygon as Position[][])
        
// }


// const multiPointFinder = (multiPoint: Position[], tGeoDocument: TransformedDocument) => {

//     switch(tGeoDocument.doc.resource.geometry.type as FieldGeometryType){
//         case 'Point':
//         case 'LineString':
//         case 'MultiLineString':
//         case 'MultiPoint':
//             return false;
//         case 'Polygon':
//             return isMultiPointInPolygon(multiPoint, tGeoDocument.transformedCoordinates as Position[][]);
//         case 'MultiPolygon':
//             return isMultiPointInMultiPolygon(multiPoint, tGeoDocument.transformedCoordinates as Position[][][]);
//     }
// };


// const lineStringFinder = (lineString: Position[], tGeoDocument: TransformedDocument) => {

//     switch(tGeoDocument.doc.resource.geometry.type as FieldGeometryType){
//         case 'Point':
//         case 'LineString':
//         case 'MultiLineString':
//         case 'MultiPoint':
//             return false;
//         case 'Polygon':
//             return isLineStringInPolygon(lineString, tGeoDocument.transformedCoordinates as Position[][]);
//         case 'MultiPolygon':
//             return isLineStringInMultiPolygon(lineString, tGeoDocument.transformedCoordinates as Position[][][]);
//     }
// };


// const multiLineStringFinder = (multiLineString: Position[][], tGeoDocument: TransformedDocument) => {

//     switch(tGeoDocument.doc.resource.geometry.type as FieldGeometryType){
//         case 'Point':
//         case 'LineString':
//         case 'MultiLineString':
//         case 'MultiPoint':
//             return false;
//         case 'Polygon':
//             return isMultiLineStringInPolygon(multiLineString, tGeoDocument.transformedCoordinates as Position[][]);
//         case 'MultiPolygon':
//             return isMultiLineStringInMultiPolygon(
//                 multiLineString,
//                 tGeoDocument.transformedCoordinates as Position[][][]);
//     }
// };