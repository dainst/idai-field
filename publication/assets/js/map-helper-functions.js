import TileLayer from 'ol/layer/Tile.js';
import TileGrid from 'ol/tilegrid/TileGrid';
import { TileImage } from 'ol/source.js';
import { Fill, Stroke, Style, Circle } from 'ol/style.js';
import { asArray } from 'ol/color';

const tileSize = 256;

export function createTileLayer(info, projectName) {
    const geoReference = info.extent;

    const extent = [
        geoReference.bottomLeftCoordinates[1],
        geoReference.bottomLeftCoordinates[0],
        geoReference.topRightCoordinates[1],
        geoReference.topRightCoordinates[0]
    ];

    const pathTemplate = `/api/image/tile/${projectName}/${info.uuid}/{z}/{x}/{y}`;

    const resolutions = getResolutions(extent, tileSize, info.width, info.height)

    const source = new TileImage({
        tileGrid: new TileGrid({
            extent,
            origin: [extent[0], extent[3]],
            resolutions,
            tileSize
        }),
        tileUrlFunction: (tileCoord) => {
            return pathTemplate
                .replace('{z}', String(tileCoord[0]))
                .replace('{x}', String(tileCoord[1]))
                .replace('{y}', String(tileCoord[2]));
        }
    });

    return new TileLayer({
        name: info.uuid,
        source: source,
        extent,
        visible: info.visible
    })
}

function getResolutions(
    extent,
    tileSize,
    width, height) {

    const portraitFormat = height > width;

    const result = [];
    const layerSize = extent[portraitFormat ? 3 : 2] - extent[portraitFormat ? 1 : 0];
    const imageSize = portraitFormat ? height : width;

    let scale = 1;
    while (tileSize < imageSize / scale) {
        result.push(layerSize / imageSize * scale);
        scale *= 2;
    }
    result.push(layerSize / imageSize * scale);

    return result.reverse();
};

export function getVisibilityKey(project, layerName) {
    return `layer-visibility-${project}/${layerName}`;
}

export const styleFunction = function (feature) {
    const props = feature.getProperties();
    if (props.type === "Polygon" || props.type === "MultiPolygon") {
        return getPolygonStyle(props);
    } else if (props.type == "LineString" || props.type === "MultiLineString") {
        return getLineStyle(props);
    } else if (props.type == "Point") {
        return getPointStyle(props);
    } else {
        console.error(`Unknown feature type ${props.type}, no matching style.`)
        return null;
    }
};

function getPolygonStyle(featureProperties) {
    const [r, g, b, a] = asArray(featureProperties.color)

    let style = new Style({
        stroke: new Stroke({
            color: `rgba(${r}, ${g}, ${b}, ${a})`,
            width: 1,
        })
    })

    if (featureProperties.fill) {
        style.setFill(new Fill({
            color: `rgba(${r * 0.5}, ${g * 0.5}, ${b * 0.5}, 0.5)`,
        }));
    } else {
        style.setFill(new Fill({
            color: `rgba(${r}, ${g}, ${b}, 0.0)`,
        }));
    }

    return style;
}


const pointRadius = 5;
const lineWidth = pointRadius * 2;

function getLineStyle(featureProperties) {
    const [r, g, b, a] = asArray(featureProperties.color)

    let color;

    if (featureProperties.fill) {
        color = `rgba(${r}, ${g}, ${b}, 1)`
    } else {
        color = `rgba(${r}, ${g}, ${b}, 0.5)`
    }

    return new Style({
        stroke: new Stroke({
            color: color,
            width: lineWidth,
        })
    })
}

function getPointStyle(featureProperties) {
    const [r, g, b, a] = asArray(featureProperties.color)

    let image = new Circle({
        radius: pointRadius,
        stroke: new Stroke({
            color: `rgba(${r}, ${g}, ${b}, ${a})`,
            width: 1,
        })
    })

    if (featureProperties.fill) {
        image.setFill(new Fill({
            color: `rgba(${r * 0.5}, ${g * 0.5}, ${b * 0.5}, 0.5)`,
        }));
    } else {
        image.setFill(new Fill({
            color: `rgba(${r}, ${g}, ${b}, 0.05)`,
        }));
    }

    return new Style({
        image: image
    })
}