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
                cx={ props.point[0] }
                cy={ props.point[1] }
                r={ props.viewBoxHeight * 0.008 } />
        </GeoTransform>
    );
};