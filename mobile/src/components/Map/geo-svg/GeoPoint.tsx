import { Position } from 'geojson';
import React from 'react';
import { Circle, CircleProps } from 'react-native-svg';
import { mapValueToNewRange } from '../cs-transform-utils';
import { GeoElementsCommonProps } from './common-props';
import GeoTransform, { GeoTransformProps } from './GeoTransform';

interface GeoPointProps extends GeoTransformProps, CircleProps, GeoElementsCommonProps {
    point: Position
}

export const GeoPoint: React.FC<GeoPointProps> = (props) => {

    const mapY = (value: number) => mapValueToNewRange(props.viewBox[3], props.viewBox[1], value,
            props.geometryBoundings.maxY, props.geometryBoundings.minY);
    const mapX = (value: number) => mapValueToNewRange(props.viewBox[2], props.viewBox[0], value,
            props.geometryBoundings.maxX, props.geometryBoundings.minX);

    return (
        <GeoTransform viewBox={ props.viewBox }>
            <Circle
                { ...props }
                cx={ mapX(props.point[0]) }
                cy={ mapY(props.point[1]) }
                r={ 1 } />
        </GeoTransform>
    );
};