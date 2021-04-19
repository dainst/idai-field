import { Position } from 'geojson';
import React from 'react';
import { CircleProps, G } from 'react-native-svg';
import { GeoPoint } from './GeoPoint';
import { GeoTransformProps } from './GeoTransform';

interface GeoMultiPointProps extends GeoTransformProps, CircleProps {
    points: Position[]
}

export const GeoMultiPoint: React.FC<GeoMultiPointProps> = (props) => {
    return (
        <G>
            {props.points.map(point => (
                <GeoPoint
                    { ...props }
                    key={ point.toString() }
                    point={ point }
                    viewBoxHeight={ props.viewBoxHeight }
                />
            ))}
        </G>
    );
};