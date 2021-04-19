import React from 'react';
import { G } from 'react-native-svg';

export interface GeoTransformProps {
    viewBox: [number, number, number, number],
}

/**
 * GeoTransform
 * Component to be wrapped around each Geo SVG component.
 * Applies transformation from GeoJSON coordinate system to SVG coordinate system
 * (flip coordinate axis y)
 * @param viewBoxHeight
 * @returns JSX element to be wrapped around Geo.. component
 */
const GeoTransform: React.FC<GeoTransformProps> = ({ viewBox, children }) => {
    const viewBoxHeight = viewBox[3];
    
    return (
        <G translate={ `0,${viewBoxHeight}` } scale="1,-1" >
            {children}
        </G>
    );
};

export default GeoTransform;