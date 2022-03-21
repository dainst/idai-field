export type FieldGeometryType = 'Polygon' | 'MultiPolygon' | 'LineString' | 'MultiLineString' | 'Point' | 'MultiPoint';

export interface FieldGeometry {

    type: FieldGeometryType;
    coordinates: Array<any>;
}
