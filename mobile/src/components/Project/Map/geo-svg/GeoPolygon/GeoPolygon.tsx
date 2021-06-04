import { Position } from 'geojson';
import React from 'react';
import { CommonPathProps } from 'react-native-svg';
import { polygonToPath } from '../../geojson-path/geojson-svg-path';
import { APath, correctStrokeZooming, GeoElementsCommonProps } from '../common-props';

interface GeoPolygonProps extends CommonPathProps, GeoElementsCommonProps {}


export const GeoPolygon: React.FC<GeoPolygonProps> = (props) => {

    
    return (
        <APath
            { ...props }
            strokeWidth={ correctStrokeZooming(props.zoom, props.strokeWidth) }
            d={ polygonToPath(props.coordinates as Position[][]) } />);
};