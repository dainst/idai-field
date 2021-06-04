import { Position } from 'geojson';
import { Animated } from 'react-native';
import { Circle, NumberProp, Path } from 'react-native-svg';
export interface GeoElementsCommonProps {
    coordinates: Position | Position[] | Position[][] | Position[][][],
    zoom: Animated.Value;
}

export const correctStrokeZooming = (zoom: Animated.Value, strokeWidth?: NumberProp):Animated.AnimatedDivision =>
    Animated.divide(strokeWidth || 1, zoom);

export const APath = Animated.createAnimatedComponent(Path);
export const ACircle = Animated.createAnimatedComponent(Circle);