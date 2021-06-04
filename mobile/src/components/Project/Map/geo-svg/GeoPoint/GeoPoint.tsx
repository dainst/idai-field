import { Position } from 'geojson';
import React from 'react';
import { CircleProps } from 'react-native-svg';
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
            r={ pointRadius } />
    );
};