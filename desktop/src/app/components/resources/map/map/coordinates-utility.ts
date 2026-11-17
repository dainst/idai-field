export class CoordinatesUtility {

    public static convertPolygonCoordinatesFromLngLatToLatLng(coordinates: number[][][]): number[][][] {

        let result: number[][][] = JSON.parse(JSON.stringify(coordinates));

        for (let pathCoordinates of result) {
            for (let pointCoordinates of pathCoordinates) {
                let lng: number = pointCoordinates[0];
                let lat: number = pointCoordinates[1];

                pointCoordinates[0] = lat;
                pointCoordinates[1] = lng;
            }
        }

        return result;
    }


    public static convertPolylineCoordinatesFromLngLatToLatLng(coordinates: number[][]): number[][] {

        let result: number[][] = JSON.parse(JSON.stringify(coordinates));

        for (let pointCoordinates of result) {
            let lng: number = pointCoordinates[0];
            let lat: number = pointCoordinates[1];

            pointCoordinates[0] = lat;
            pointCoordinates[1] = lng;
        }

        return result;
    }
}