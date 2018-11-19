package org.dainst.idaifield.model;


/**
 * @author Thomas Kleinke
 */
public class Geometry {

    private GeometryType type;
    private double[][][][] coordinates;


    public GeometryType getType() {

        return type;
    }


    public void setType(GeometryType geometryType) {

        this.type = geometryType;
    }


    public double[][][][] getCoordinates() {

        return coordinates;
    }


    public void setCoordinates(double[][][][] coordinates) {

        this.coordinates = coordinates;
    }


    public String getGeojsonType() {

        switch(type) {
            case MULTIPOINT:
                if (coordinates[0][0].length > 1) {
                    return "MultiPoint";
                } else {
                    return "Point";
                }
            case MULTIPOLYLINE:
                if (coordinates[0].length > 1) {
                    return "MultiLineString";
                } else {
                    return "LineString";
                }
            case MULTIPOLYGON:
                if (coordinates.length > 1) {
                    return "MultiPolygon";
                } else {
                    return "Polygon";
                }
            default:
                return null;
        }
    }
}
