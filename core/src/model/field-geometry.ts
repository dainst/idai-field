export interface FieldGeometry {

    type:  'Polygon' | 'MultiPolygon' | 'LineString' | 'MultiLineString' | 'Point' | 'MultiPoint';
    coordinates: Array<any>;
}
