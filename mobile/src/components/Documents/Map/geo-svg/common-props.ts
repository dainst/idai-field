import { Position } from 'geojson';
export interface GeoElementsCommonProps {
    coordinates: Position | Position[] | Position[][] | Position[][][]
}