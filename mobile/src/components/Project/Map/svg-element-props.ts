import { Document, FieldGeometryType, ProjectConfiguration } from 'idai-field-core';
import { strokeWidth } from './geo-svg/constants';
import { GeoMap, getGeoMapParents } from './geometry-map/geometry-map';

interface ElementProps {
    fill: string;
    opacity: number;
    strokeWidth: number;
    onPress?: () => void;
    stroke?: string;
    strokeDasharray?: number[];
    strokeOpacity?: number;
}

export const getDocumentFillOpacityPress = (
    doc: Document,
    geoMap: GeoMap,
    onPressHandler: (doc: Document) => void,
    config: ProjectConfiguration,
    isHighlighted: boolean,
    isSelected?: boolean,): ElementProps => {
    
    const color = config.getColorForCategory(doc.resource.category);
    const geoType = doc.resource.geometry.type;
    const opacity = 0.5;
    if(isSelected){
        return {
            opacity,
            stroke: isHighlighted ? 'white' : color,
            fill: color,
            strokeWidth: isHighlighted ? 6 : strokeWidth,
            onPress: () => onPressHandler(doc)
        };
    } else {
        const parentPressHandler = isParentSelected(geoMap, doc.resource.id);
        return {
            opacity,
            fill: isGeoTypePoint(geoType) ? color : 'none',
            stroke: color, strokeOpacity: 0.5, strokeWidth,
            onPress: parentPressHandler ? () => onPressHandler(parentPressHandler) : undefined };
    }
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
