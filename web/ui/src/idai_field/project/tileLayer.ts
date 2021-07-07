import { ResultDocument } from '../../api/result';

export const getTileLayerExtent = (document: ResultDocument): [number, number, number, number] => [
    document.resource.georeference.bottomLeftCoordinates[1],
    document.resource.georeference.bottomLeftCoordinates[0],
    document.resource.georeference.topRightCoordinates[1],
    document.resource.georeference.topRightCoordinates[0]
];


export const getResolutions = (
        extent: [number, number, number, number],
        tileSize: number,
        document: ResultDocument): number[] => {

    const portraitFormat = document.resource.height > document.resource.width;

    const result = [];
    const layerSize = extent[portraitFormat ? 3 : 2] - extent[portraitFormat ? 1 : 0];
    const imageSize = portraitFormat ? document.resource.height : document.resource.width;
    
    let scale = 1;
    while (tileSize < imageSize / scale) {
        result.push(layerSize / imageSize * scale);
        scale *= 2;
    }
    result.push(layerSize / imageSize * scale);

    return result.reverse();
};
