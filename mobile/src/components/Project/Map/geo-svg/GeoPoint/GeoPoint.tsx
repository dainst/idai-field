import { Position } from 'geojson';
import React from 'react';
import { Circle, CircleProps } from 'react-native-svg';
import { GeoElementsCommonProps } from '../common-props';
import { pointRadius } from '../constants';

interface GeoPointProps extends CircleProps, GeoElementsCommonProps {}

export const GeoPoint: React.FC<GeoPointProps> = (props) => {

    const [x, y] = props.coordinates as Position;

    return (
        <Circle
            { ...props }
            cx={ x }
            cy={ y }
            r={ pointRadius }
            vectorEffect="non-scaling-stroke" />
    );
};