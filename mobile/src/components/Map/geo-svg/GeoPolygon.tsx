import { Position } from 'geojson';
import React from 'react';
import { CommonPathProps, Path } from 'react-native-svg';
import { polygonToPath } from '../geojson-path/geojson-svg-path';
import { GeoElementsCommonProps } from './common-props';

interface GeoPolygonProps extends CommonPathProps, GeoElementsCommonProps {}

export const GeoPolygon: React.FC<GeoPolygonProps> = (props) => {
    
    return (
        <Path
            { ...props }
            d={ polygonToPath(props.coordinates as Position[][], props.csTransformFunction) } />);
};