import { Position } from 'geojson';
import React from 'react';
import { CommonPathProps, Path } from 'react-native-svg';
import { multiPolygonToPath } from '../geojson-path/geojson-svg-path';
import { GeoElementsCommonProps } from './common-props';
import GeoTransform, { GeoTransformProps } from './GeoTransform';

interface GeoMultiPolygonProps extends CommonPathProps, GeoTransformProps, GeoElementsCommonProps {
    coordinates: Position[][][];
}

export const GeoMultiPolygon: React.FC<GeoMultiPolygonProps> = (props) => {
    
    return (
        <GeoTransform viewBox={ props.viewBox }>
            <Path
                { ...props }
                d={ multiPolygonToPath(props.coordinates, props.geometryBoundings, props.viewBox) } />
        </GeoTransform>);
};