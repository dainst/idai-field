import { Position } from 'geojson';
import React from 'react';
import { CommonPathProps, Path } from 'react-native-svg';
import { multiPolygonToPath } from '../geojson-path/geojson-svg-path';

interface GeoMultiPolygonProps extends CommonPathProps {
    coordinates: Position[][][];
}

const GeoMultiPolygon: React.FC<GeoMultiPolygonProps> = (props) => {
    
    return (
        <Path
            { ...props }
            d={ multiPolygonToPath(props.coordinates) } />
        );
};

export default GeoMultiPolygon;