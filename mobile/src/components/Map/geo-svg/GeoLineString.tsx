import { Position } from 'geojson';
import React from 'react';
import { CommonPathProps, Path } from 'react-native-svg';
import { lineStringToPath } from '../geojson-path/geojson-svg-path';
import { GeoElementsCommonProps } from './common-props';
import GeoTransform, { GeoTransformProps } from './GeoTransform';

interface GeoLineStringProps extends CommonPathProps, GeoTransformProps, GeoElementsCommonProps {
    coordinates: Position[]
}

export const GeoLineString: React.FC<GeoLineStringProps> = (props) => {
    return (
        <GeoTransform viewBox={ props.viewBox }>
            <Path
                { ...props }
                fill="none"
                strokeWidth={ 1 }
                d={ lineStringToPath(props.coordinates, props.geometryBoundings, props.viewBox ) } />
        </GeoTransform>
    );
};