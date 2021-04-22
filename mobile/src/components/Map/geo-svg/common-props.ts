import { Position } from 'geojson';
export interface GeoElementsCommonProps {
    csTransformFunction: (pos: Position) => Position
}