/**
 * @author Thomas Kleinke
 */
export class GeometryHelper {

    public static getCoordinatesFromPolygons(polygons: Array<L.Polygon>): number[][][][] {

        const coordinates: number[][][][] = [];

        polygons.forEach(polygon => {
            coordinates.push(this.getCoordinatesFromPolygon(polygon));
        });

        return coordinates;
    }


    public static getCoordinatesFromPolygon(polygon: L.Polygon): number[][][] {

        const coordinates: number[][][] = [];
        const latLngs = polygon.getLatLngs();

        for (let i in latLngs) {
            coordinates.push([]);
            for (let j in latLngs[i]) {
                coordinates[i].push([
                    (latLngs[i] as any)[j].lng,
                    (latLngs[i] as any)[j].lat
                ]);
            }
        }

        return coordinates;
    }


    public static getCoordinatesFromPolylines(polylines: Array<L.Polyline>): number[][][] {

        const coordinates: number[][][] = [];

        polylines.forEach(polyline => {
            coordinates.push(this.getCoordinatesFromPolyline(polyline));
        });

        return coordinates;
    }


    public static getCoordinatesFromPolyline(polyline: L.Polyline): number[][] {

        const coordinates: number[][] = [];
        const latLngs = polyline.getLatLngs();

        latLngs.forEach(latLng => {
            coordinates.push([latLng.lng, latLng.lat]);
        });

        return coordinates;
    }


    public static getCoordinatesFromMarkers(markers: Array<L.CircleMarker>): number[][] {

        const coordinates: number[][] = [];

        markers.forEach(marker => {
            coordinates.push(this.getCoordinatesFromMarker(marker));
        });

        return coordinates;
    }


    public static getCoordinatesFromMarker(marker: L.CircleMarker): number[] {

        const latLng = marker.getLatLng();
        return [latLng.lng, latLng.lat];
    }
}
