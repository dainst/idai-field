import { Position } from 'geojson';
import React from 'react';
import { CircleProps } from 'react-native-svg';
import { GeoElementsCommonProps } from './common-props';
import { GeoPoint } from './GeoPoint';

interface GeoMultiPointProps extends CircleProps, GeoElementsCommonProps {}

export const GeoMultiPoint: React.FC<GeoMultiPointProps> = (props) => {
    return (
        <>
            {(props.coordinates as Position[]).map((point: Position) => (
                <GeoPoint
                    { ...props }
                    key={ point.toString() }
                    coordinates={ point }
                    csTransformFunction={ props.csTransformFunction }
                />
            ))}
        </>
    );
};