package org.dainst.idaifield.converter;

import org.dainst.idaifield.ErrorMessage;
import org.dainst.idaifield.model.Geometry;
import org.dainst.idaifield.model.GeometryType;
import org.locationtech.jts.geom.*;


/**
 * @author Thomas Kleinke
 */
class GeometryConverter {

    static Geometry convert(org.locationtech.jts.geom.Geometry shapefileGeometry) throws Exception {

        Geometry geometry = new Geometry();

        String type = shapefileGeometry.getGeometryType();

        switch(type) {
            case "Point":
                geometry.setCoordinates(new double[][][][]{{{
                    getPointCoordinates(shapefileGeometry.getCoordinate())
                }}});
                geometry.setType(GeometryType.MULTIPOINT);
            case "MultiPoint":
                geometry.setCoordinates(new double[][][][]{{
                    getMultiPointOrPolylineCoordinates(shapefileGeometry)
                }});
                geometry.setType(GeometryType.MULTIPOINT);
                break;
            case "LineString":
                geometry.setCoordinates(new double[][][][]{{
                    getMultiPointOrPolylineCoordinates(shapefileGeometry)
                }});
                geometry.setType(GeometryType.MULTIPOLYLINE);
            case "MultiLineString":
                geometry.setCoordinates(new double[][][][]{
                    getMultiPolylineCoordinates((MultiLineString) shapefileGeometry)
                });
                geometry.setType(GeometryType.MULTIPOLYLINE);
                break;
            case "Polygon":
                geometry.setCoordinates(new double[][][][]{
                        getPolygonCoordinates((Polygon) shapefileGeometry)
                });
                geometry.setType(GeometryType.MULTIPOLYGON);
            case "MultiPolygon":
                geometry.setCoordinates(getMultipolygonCoordinates((MultiPolygon) shapefileGeometry));
                geometry.setType(GeometryType.MULTIPOLYGON);
                break;
            default:
                throw new Exception(ErrorMessage.CONVERTER_UNSUPPORTED_GEOMETRY_TYPE.name() + " " + type);
        }

        return geometry;
    }


    private static double[] getPointCoordinates(Coordinate point) {

        double[] coordinates = new double[Double.isNaN(point.getZ()) ? 2 : 3];
        coordinates[0] = point.getX();
        coordinates[1] = point.getY();
        if (!Double.isNaN(point.getZ())) coordinates[2] = point.getZ();

        return coordinates;
    }


    private static double[][] getMultiPointOrPolylineCoordinates(org.locationtech.jts.geom.Geometry geometry) {

        double[][] coordinates = new double[geometry.getCoordinates().length][];

        for (int i = 0; i < geometry.getCoordinates().length; i++) {
            coordinates[i] = getPointCoordinates(geometry.getCoordinates()[i]);
        }

        return coordinates;
    }


    private static double[][][] getMultiPolylineCoordinates(MultiLineString multiPolyline) {

        double[][][] coordinates = new double[multiPolyline.getNumGeometries()][][];

        for (int i = 0; i < multiPolyline.getNumGeometries(); i++) {
            org.locationtech.jts.geom.Geometry geometry = multiPolyline.getGeometryN(i);
            coordinates[i] = getMultiPointOrPolylineCoordinates(geometry);
        }

        return coordinates;
    }


    private static double[][][] getPolygonCoordinates(Polygon polygon) {

        double[][][] coordinates = new double[polygon.getNumInteriorRing() + 1][][];

        coordinates[0] = getMultiPointOrPolylineCoordinates(polygon.getExteriorRing());

        for (int i = 0; i < polygon.getNumInteriorRing(); i++) {
            coordinates[i + 1] = getMultiPointOrPolylineCoordinates(polygon.getInteriorRingN(i));
        }

        return coordinates;
    }


    private static double[][][][] getMultipolygonCoordinates(MultiPolygon multiPolygon) {

        double[][][][] coordinates = new double[multiPolygon.getNumGeometries()][][][];

        for (int i = 0; i < multiPolygon.getNumGeometries(); i++) {
            Polygon polygon = (Polygon) multiPolygon.getGeometryN(i);
            coordinates[i] = getPolygonCoordinates(polygon);
        }

        return coordinates;
    }
}
