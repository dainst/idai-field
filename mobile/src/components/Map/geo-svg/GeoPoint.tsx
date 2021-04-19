import { Position } from 'geojson';
import React from 'react';
import { Circle, CircleProps } from 'react-native-svg';
import GeoTransform, { GeoTransformProps } from './GeoTransform';

interface GeoPointProps extends GeoTransformProps, CircleProps {
    point: Position
}

export const GeoPoint: React.FC<GeoPointProps> = (props) => {
    return (
        <GeoTransform viewBoxHeight={ props.viewBoxHeight }>
            <Circle
                { ...props }
                r={ props.viewBoxHeight * 0.002 } />
        </GeoTransform>
    );
};