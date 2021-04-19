import { Position } from 'geojson';
import React from 'react';
import { CommonPathProps, Path } from 'react-native-svg';
import { multiLineStringToPath } from '../geojson-path/geojson-svg-path';
import GeoTransform, { GeoTransformProps } from './GeoTransform';

interface GeoMultiLineStringProps extends CommonPathProps, GeoTransformProps {
    coordinates: Position[][];
}

export const GeoMultiLineString: React.FC<GeoMultiLineStringProps> = (props) => {
    return (
        <GeoTransform viewBoxHeight={ props.viewBoxHeight }>
            <Path
                { ...props }
                fill="none"
                d={ multiLineStringToPath(props.coordinates) } />
        </GeoTransform>
    );
};