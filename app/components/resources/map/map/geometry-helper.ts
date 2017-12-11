/**
 * @author Thomas Kleinke
 */
export class GeometryHelper {

    public static getCoordinatesFromPolygons(polygons: Array<L.Polygon>): number[][][][] {

        let coordinates = [] as any;

        for (let polygon of polygons) {
            coordinates.push(GeometryHelper.getCoordinatesFromPolygon(polygon) as never);
        }

        return coordinates;
    }


    public static getCoordinatesFromPolygon(polygon: L.Polygon): number[][][] {

        let coordinates = [] as any;
        let latLngs = polygon.getLatLngs();

        for (let i in latLngs) {
            coordinates.push([] as never);
            for (let j in latLngs[i]) {
                coordinates[i].push([
                    (latLngs[i] as any)[j].lng as any,
                    (latLngs[i] as any)[j].lat as any] as never);
            }
        }

        return coordinates;
    }


    public static getCoordinatesFromPolylines(polylines: Array<L.Polyline>): number[][][] {

        let coordinates = [] as any;

        for (let polyline of polylines) {
            coordinates.push(GeometryHelper.getCoordinatesFromPolyline(polyline) as never);
        }

        return coordinates;
    }


    public static getCoordinatesFromPolyline(polyline: L.Polyline): number[][] {

        let coordinates = [] as any;
        let latLngs = polyline.getLatLngs();

        for (let i in latLngs) {
            coordinates.push([ latLngs[i].lng , latLngs[i].lat ] as never);
        }

        return coordinates;
    }
}