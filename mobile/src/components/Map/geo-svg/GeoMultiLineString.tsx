import { Position } from 'geojson';
import React from 'react';
import { CommonPathProps, Path } from 'react-native-svg';
import { multiLineStringToPath } from '../geojson-path/geojson-svg-path';
import { GeoElementsCommonProps } from './common-props';
import GeoTransform, { GeoTransformProps } from './GeoTransform';

interface GeoMultiLineStringProps extends CommonPathProps, GeoTransformProps, GeoElementsCommonProps {
    coordinates: Position[][];
}

export const GeoMultiLineString: React.FC<GeoMultiLineStringProps> = (props) => {
    return (
        <GeoTransform viewBox={ props.viewBox }>
            <Path
                { ...props }
                fill="none"
                strokeWidth={ 0.3 }
                d={ multiLineStringToPath(props.coordinates, props.geometryBoundings, props.viewBox) } />
        </GeoTransform>
    );
};