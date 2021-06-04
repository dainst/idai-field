import { Position } from 'geojson';
import React from 'react';
import { CommonPathProps } from 'react-native-svg';
import { multiPolygonToPath } from '../geojson-path/geojson-svg-path';
import { APath, correctStrokeZooming, GeoElementsCommonProps } from './common-props';

interface GeoMultiPolygonProps extends CommonPathProps, GeoElementsCommonProps {}

export const GeoMultiPolygon: React.FC<GeoMultiPolygonProps> = (props) => {
    
    return (
        <APath
            { ...props }
            strokeWidth={ correctStrokeZooming(props.zoom, props.strokeWidth) }
            d={ multiPolygonToPath(props.coordinates as Position[][][]) } />);
};