import { Position } from 'geojson';
export interface GeoElementsCommonProps {
    csTransformFunction: (pos: Position) => Position
    coordinates: Position | Position[] | Position[][] | Position[][][]
}