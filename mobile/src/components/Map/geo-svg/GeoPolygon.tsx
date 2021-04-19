import { Position } from 'geojson';
import React from 'react';
import { CommonPathProps, Path } from 'react-native-svg';
import { polygonToPath } from '../geojson-path/geojson-svg-path';
import { GeoElementsCommonProps } from './common-props';
import GeoTransform, { GeoTransformProps } from './GeoTransform';

interface GeoPolygonProps extends CommonPathProps, GeoTransformProps, GeoElementsCommonProps {
    coordinates: Position[][];
}

export const GeoPolygon: React.FC<GeoPolygonProps> = (props) => {
    
    return (
        <GeoTransform viewBox={ props.viewBox }>
            <Path
                { ...props }
                d={ polygonToPath(props.coordinates, props.geometryBoundings, props.viewBox) } />
        </GeoTransform>);
};