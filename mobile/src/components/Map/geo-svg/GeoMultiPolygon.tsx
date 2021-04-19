import { Position } from 'geojson';
import React from 'react';
import { CommonPathProps, Path } from 'react-native-svg';
import { multiPolygonToPath } from '../geojson-path/geojson-svg-path';
import GeoTransform, { GeoTransformProps } from './GeoTransform';

interface GeoMultiPolygonProps extends CommonPathProps, GeoTransformProps {
    coordinates: Position[][][];
}

export const GeoMultiPolygon: React.FC<GeoMultiPolygonProps> = (props) => {
    
    return (
        <GeoTransform viewBoxHeight={ props.viewBoxHeight }>
            <Path
                { ...props }
                d={ multiPolygonToPath(props.coordinates) } />
        </GeoTransform>);
};

//export GeoMultiPolygon;