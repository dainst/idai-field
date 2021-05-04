import { Position } from 'geojson';
import React from 'react';
import { CommonPathProps, Path } from 'react-native-svg';
import { multiPolygonToPath } from '../geojson-path/geojson-svg-path';
import { GeoElementsCommonProps } from './common-props';

interface GeoMultiPolygonProps extends CommonPathProps, GeoElementsCommonProps {}

export const GeoMultiPolygon: React.FC<GeoMultiPolygonProps> = (props) => {
    
    return (
        <Path
            { ...props }
            d={ multiPolygonToPath(props.coordinates as Position[][][], props.csTransformFunction) } />);
};