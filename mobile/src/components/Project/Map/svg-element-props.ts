import { FieldGeometryType } from 'idai-field-core';
import { strokeWidth } from './geo-svg/constants';

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
    geoType: FieldGeometryType,
    color: string,
    onPressHandler: () => void,
    isHighlighted?: boolean,
    isSelected?: boolean): ElementProps => {

    const opacity = 0.5;
    if(isSelected){
        return {
            opacity,
            stroke: isHighlighted ? 'white' : color,
            fill: color,
            strokeWidth: isHighlighted ? 6 : strokeWidth,
            onPress: onPressHandler
        };
    } else {
        return {
            opacity,
            fill: isGeoTypePoint(geoType) ? color : 'none',
            stroke: color, strokeOpacity: 0.5, strokeWidth };
    }
};


const isGeoTypePoint = (type: FieldGeometryType) => type === 'Point' || type === 'MultiPoint';
