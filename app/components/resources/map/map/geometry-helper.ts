/**
 * @author Thomas Kleinke
 */
export class GeometryHelper {

    public static getCoordinatesFromPolygons(polygons: Array<L.Polygon>): number[][][][] {

        let coordinates = [];

        for (let polygon of polygons) {
            coordinates.push(GeometryHelper.getCoordinatesFromPolygon(polygon));
        }

        return coordinates;
    }


    public static getCoordinatesFromPolygon(polygon: L.Polygon): number[][][] {

        let coordinates = [];
        let latLngs = polygon.getLatLngs();

        for (let i in latLngs) {
            coordinates.push([]);
            for (let j in latLngs[i]) {
                coordinates[i].push([ latLngs[i][j].lng , latLngs[i][j].lat ]);
            }
        }

        return coordinates;
    }


    public static getCoordinatesFromPolylines(polylines: Array<L.Polyline>): number[][][] {

        let coordinates = [];

        for (let polyline of polylines) {
            coordinates.push(GeometryHelper.getCoordinatesFromPolyline(polyline));
        }

        return coordinates;
    }


    public static getCoordinatesFromPolyline(polyline: L.Polyline): number[][] {

        let coordinates = [];
        let latLngs = polyline.getLatLngs();

        for (let i in latLngs) {
            coordinates.push([ latLngs[i].lng , latLngs[i].lat ]);
        }

        return coordinates;
    }
}