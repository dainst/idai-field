import { Position } from 'geojson';
import React from 'react';
import { CommonPathProps } from 'react-native-svg';
import { lineStringToPath } from '../geojson-path/geojson-svg-path';
import { APath, correctStrokeZooming, GeoElementsCommonProps } from './common-props';
import { strokeWidth } from './constants';

interface GeoLineStringProps extends CommonPathProps, GeoElementsCommonProps {}

export const GeoLineString: React.FC<GeoLineStringProps> = (props) => {

    return (
        <APath
            { ...props }
            fill="none"
            strokeWidth={ correctStrokeZooming(props.zoom, strokeWidth) }
            d={ lineStringToPath(props.coordinates as Position[]) } />
    );
};