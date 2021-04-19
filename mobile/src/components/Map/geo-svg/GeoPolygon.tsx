import { Position } from 'geojson';
import React from 'react';
import { CommonPathProps, Path } from 'react-native-svg';
import { polygonToPath } from '../geojson-path/geojson-svg-path';
import GeoTransform, { GeoTransformProps } from './GeoTransform';

interface GeoPolygonProps extends CommonPathProps, GeoTransformProps {
    coordinates: Position[][];
}

export const GeoPolygon: React.FC<GeoPolygonProps> = (props) => {
    
    return (
        <GeoTransform viewBoxHeight={ props.viewBoxHeight }>
            <Path
                { ...props }
                d={ polygonToPath(props.coordinates) } />
        </GeoTransform>);
};