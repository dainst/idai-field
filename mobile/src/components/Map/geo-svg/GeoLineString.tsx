import { Position } from 'geojson';
import React from 'react';
import { CommonPathProps, Path } from 'react-native-svg';
import { lineStringToPath } from '../geojson-path/geojson-svg-path';
import { GeoElementsCommonProps } from './common-props';

interface GeoLineStringProps extends CommonPathProps, GeoElementsCommonProps {}

export const GeoLineString: React.FC<GeoLineStringProps> = (props) => {

    return (
        <Path
            { ...props }
            fill="none"
            strokeWidth={ 0.3 }
            d={ lineStringToPath(props.coordinates as Position[], props.csTransformFunction) } />
    );
};