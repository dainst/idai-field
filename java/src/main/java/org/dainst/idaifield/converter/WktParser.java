package org.dainst.idaifield.converter;

import org.dainst.idaifield.model.Geometry;
import org.dainst.idaifield.model.GeometryType;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.MultiLineString;
import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.io.WKTReader;


/**
 * @author Thomas Kleinke
 */
class WktParser {

    static Geometry getMultiPointGeometry(String wkt) throws Exception {

        Geometry geometry = new Geometry();

        geometry.setCoordinates(new double[][][][]{{getMultiPointOrPolylineCoordinates(
                new WKTReader().read(wkt)
        )}});
        geometry.setType(GeometryType.MULTIPOINT);

        return geometry;
    }


    static Geometry getMultiPolylineGeometry(String wkt) throws Exception {

        Geometry geometry = new Geometry();

        geometry.setCoordinates(new double[][][][]{getMultiPolylineCoordinates(
                (MultiLineString) new WKTReader().read(wkt)
        )});
        geometry.setType(GeometryType.MULTIPOLYLINE);

        return geometry;
    }


    static Geometry getMultiPolygonGeometry(String wkt) throws Exception {

        Geometry geometry = new Geometry();

        geometry.setCoordinates(getMultipolygonCoordinates((MultiPolygon) new WKTReader().read(wkt)));
        geometry.setType(GeometryType.MULTIPOLYGON);

        return geometry;
    }


    private static double[][] getMultiPointOrPolylineCoordinates(org.locationtech.jts.geom.Geometry geometry) {

        double[][] coordinates = new double[geometry.getCoordinates().length][];

        for (int i = 0; i < geometry.getCoordinates().length; i++) {
            Coordinate coordinate = geometry.getCoordinates()[i];
            coordinates[i] = new double[Double.isNaN(coordinate.getZ()) ? 2 : 3];
            coordinates[i][0] = geometry.getCoordinates()[i].getX();
            coordinates[i][1] = geometry.getCoordinates()[i].getY();
            if (!Double.isNaN(coordinate.getZ())) coordinates[i][1] = coordinate.getZ();
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
