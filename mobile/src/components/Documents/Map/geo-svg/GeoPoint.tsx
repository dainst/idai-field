import { Position } from 'geojson';
import React from 'react';
import { Circle, CircleProps } from 'react-native-svg';
import { GeoElementsCommonProps } from './common-props';

interface GeoPointProps extends CircleProps, GeoElementsCommonProps {}

export const GeoPoint: React.FC<GeoPointProps> = (props) => {

    const [x, y] = props.csTransformFunction(props.coordinates as Position);

    return (
        <Circle
            { ...props }
            cx={ x }
            cy={ y }
            r={ 1 } />
    );
};