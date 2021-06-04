import { Position } from 'geojson';
import React from 'react';
import { CommonPathProps } from 'react-native-svg';
import { multiLineStringToPath } from '../geojson-path/geojson-svg-path';
import { APath, correctStrokeZooming, GeoElementsCommonProps } from './common-props';
import { strokeWidth } from './constants';

interface GeoMultiLineStringProps extends CommonPathProps, GeoElementsCommonProps {}

export const GeoMultiLineString: React.FC<GeoMultiLineStringProps> = (props) => {
    return (
        <APath
            { ...props }
            fill="none"
            strokeWidth={ correctStrokeZooming(props.zoom, strokeWidth) }
            d={ multiLineStringToPath(props.coordinates as Position[][]) } />
    );
};