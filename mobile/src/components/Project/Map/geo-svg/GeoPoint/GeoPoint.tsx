import { Position } from 'geojson';
import React from 'react';
import { Animated } from 'react-native';
import { CircleProps, NumberProp } from 'react-native-svg';
import { ACircle, correctStrokeZooming, GeoElementsCommonProps } from '../common-props';
import { pointRadius } from '../constants';

interface GeoPointProps extends CircleProps, GeoElementsCommonProps {}

export const GeoPoint: React.FC<GeoPointProps> = (props) => {

    const [x, y] = props.coordinates as Position;

    return (
        <ACircle
            { ...props }
            cx={ x }
            cy={ y }
            strokeWidth={ correctStrokeZooming(props.zoom, props.strokeWidth) }
            r={ correctRadiusZooming(props.zoom, pointRadius) } />
    );
};

const correctRadiusZooming = (zoom: Animated.Value, r?: NumberProp): Animated.AnimatedDivision =>
    Animated.divide(r || 1, zoom);