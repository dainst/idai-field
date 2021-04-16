import { Position } from 'geojson';
import React from 'react';
import { CommonPathProps, Path } from 'react-native-svg';
import { polygonToPath } from '../geojson-path/geojson-svg-path';

interface GeoPolygonProps extends CommonPathProps {
    coordinates: Position[][];
}

const GeoPolygon: React.FC<GeoPolygonProps> = (props) => {
    
    return (
        <Path
            { ...props }
            d={ polygonToPath(props.coordinates) } />
        );
};

export default GeoPolygon;