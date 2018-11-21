package org.dainst.idaifield.converter;

import org.dainst.idaifield.ErrorMessage;
import org.dainst.idaifield.model.Geometry;
import org.dainst.idaifield.model.GeometryType;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.MultiLineString;
import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Polygon;


/**
 * @author Thomas Kleinke
 */
class GeometryConverter {

    static Geometry convert(org.locationtech.jts.geom.Geometry shapefileGeometry) throws Exception {

        Geometry geometry = new Geometry();

        String type = shapefileGeometry.getGeometryType();

        // TODO Support Point, LineString, Polygon

        switch(type) {
            case "MultiPoint":
                geometry.setCoordinates(new double[][][][]{{
                    getMultiPointOrPolylineCoordinates(shapefileGeometry)
                }});
                geometry.setType(GeometryType.MULTIPOINT);
                break;
            case "MultiLineString":
                geometry.setCoordinates(new double[][][][]{
                        getMultiPolylineCoordinates((MultiLineString) shapefileGeometry)
                });
                geometry.setType(GeometryType.MULTIPOLYLINE);
                break;
            case "MultiPolygon":
                geometry.setCoordinates(getMultipolygonCoordinates((MultiPolygon) shapefileGeometry));
                geometry.setType(GeometryType.MULTIPOLYGON);
                break;
            default:
                throw new Exception(ErrorMessage.CONVERTER_UNSUPPORTED_GEOMETRY_TYPE.name() + " " + type);
        }

        return geometry;
    }


    private static double[][] getMultiPointOrPolylineCoordinates(org.locationtech.jts.geom.Geometry geometry) {

        double[][] coordinates = new double[geometry.getCoordinates().length][];

        for (int i = 0; i < geometry.getCoordinates().length; i++) {
            Coordinate coordinate = geometry.getCoordinates()[i];
            coordinates[i] = new double[Double.isNaN(coordinate.getZ()) ? 2 : 3];
            coordinates[i][0] = geometry.getCoordinates()[i].getX();
            coordinates[i][1] = geometry.getCoordinates()[i].getY();
            if (!Double.isNaN(coordinate.getZ())) coordinates[i][2] = coordinate.getZ();
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
