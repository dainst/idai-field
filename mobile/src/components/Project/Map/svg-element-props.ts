import { Document, FieldGeometryType, ProjectConfiguration } from 'idai-field-core';
import { strokeWidth } from './geo-svg/constants';
import { GeoMap, getGeoMapParents } from './geometry-map/geometry-map';

interface ElementProps {
    fill: string;
    opacity: number;
    strokeWidth: number;
    onPress?: () => void;
    onLongPress?: () => void;
    stroke?: string;
    strokeDasharray?: number[];
    strokeOpacity?: number;
}

export const getDocumentFillOpacityPress = (
    doc: Document,
    geoMap: GeoMap,
    onPressHandler: (doc: Document) => void,
    onLongPressHandler: (doc: Document) => void,
    config: ProjectConfiguration,
    isHighlighted: boolean,
    isSelected?: boolean,): ElementProps => {
    
    const color = config.getCategory(doc.resource.category)?.color || 'black';
    const geoType = doc.resource.geometry.type;
    const opacity = 0.5;
    if(isSelected){
        return {
            opacity,
            stroke: isHighlighted ? 'white' : color,
            fill: color,
            strokeWidth: isHighlighted ? 6 : strokeWidth,
            onPress: () => onPressHandler(doc),
            onLongPress: () => onLongPressHandler(doc)
        };
    } else {
        return {
            opacity,
            fill: isGeoTypePoint(geoType) ? color : 'none',
            stroke: color, strokeOpacity: 0.5, strokeWidth,
            onPress: propagateParentPressHandler(geoMap, onPressHandler, doc),
            onLongPress: propagateParentPressHandler(geoMap, onLongPressHandler, doc),
        };
    }
};


const propagateParentPressHandler = (geoMap: GeoMap, pressHandler: (doc: Document) => void, doc: Document) => {
    const parentPressHandler = isParentSelected(geoMap, doc.resource.id);
    if(parentPressHandler) return () => pressHandler(parentPressHandler);
    else return;
};


const isParentSelected = (geoMap: GeoMap, docId: string) => {
    
    const parentIds = getGeoMapParents(geoMap, docId);
    for(const parentId of parentIds){
        const parentEntry = geoMap.get(parentId);
        if(parentEntry && parentEntry.isSelected) {
            return parentEntry.doc;
        }
    }
    return null;
};


const isGeoTypePoint = (type: FieldGeometryType) => type === 'Point' || type === 'MultiPoint';
