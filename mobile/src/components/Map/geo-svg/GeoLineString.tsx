import { Position } from 'geojson';
import React from 'react';
import { CommonPathProps, Path } from 'react-native-svg';
import { lineStringToPath } from '../geojson-path/geojson-svg-path';
import GeoTransform, { GeoTransformProps } from './GeoTransform';

interface GeoLineStringProps extends CommonPathProps, GeoTransformProps {
    coordinates: Position[]
}

export const GeoLineString: React.FC<GeoLineStringProps> = (props) => {
    return (
        <GeoTransform viewBoxHeight={ props.viewBoxHeight }>
            <Path
                { ...props }
                fill="none"
                strokeWidth={ props.viewBoxHeight * 0.01 }
                d={ lineStringToPath(props.coordinates) } />
        </GeoTransform>
    );
};