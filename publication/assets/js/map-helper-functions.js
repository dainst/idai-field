import TileLayer from "ol/layer/Tile.js";
import TileGrid from "ol/tilegrid/TileGrid";
import { TileImage } from "ol/source.js";
import { Fill, Stroke, Style, Circle } from "ol/style.js";
import { asArray } from "ol/color";

const tileSize = 256;

export function createTileLayer(info, projectName) {
    const geoReference = info.extent;

    const extent = [
        geoReference.bottomLeftCoordinates[1],
        geoReference.bottomLeftCoordinates[0],
        geoReference.topRightCoordinates[1],
        geoReference.topRightCoordinates[0],
    ];

    const pathTemplate = `/api/image/tile/${projectName}/${info.uuid}/{z}/{x}/{y}`;

    const resolutions = getResolutions(
        extent,
        tileSize,
        info.width,
        info.height,
    );

    const source = new TileImage({
        tileGrid: new TileGrid({
            extent,
            origin: [extent[0], extent[3]],
            resolutions,
            tileSize,
        }),
        tileUrlFunction: (tileCoord) => {
            return pathTemplate
                .replace("{z}", String(tileCoord[0]))
                .replace("{x}", String(tileCoord[1]))
                .replace("{y}", String(tileCoord[2]));
        },
    });

    return new TileLayer({
        name: info.uuid,
        source: source,
        extent,
        visible: info.visible,
    });
}

export function getVisibilityKey(project, layerName) {
    return `layer-visibility-${project}/${layerName}`;
}

export function renderPreviewOverlay(
    hookReference,
    map,
    overlay,
    contentNode,
    coordinate,
    categoryLabels,
    preferredLanguage,
    projectKey,
    projectDraftDate,
    features,
    renderCloseButton,
) {
    while (contentNode.firstChild) {
        contentNode.removeChild(contentNode.firstChild);
    }

    if (features.length > 0) {
        contentNode.appendChild(
            renderPreviewList(
                hookReference,
                categoryLabels,
                preferredLanguage,
                projectKey,
                projectDraftDate,
                features,
                renderCloseButton,
            ),
        );

        const anchorPixel = map.getPixelFromCoordinate(coordinate);
        const mapSize = map.getSize();

        const right = anchorPixel[0] > mapSize[0] * 0.5 ? "right" : "left";
        const bottom = anchorPixel[1] > mapSize[1] * 0.5 ? "bottom" : "top";

        const offsetX = right == "right" ? -5 : 5;
        const offsetY = bottom == "bottom" ? -5 : 5;

        overlay.setPositioning(`${bottom}-${right}`);
        overlay.setOffset([offsetX, offsetY]);
        overlay.setPosition(coordinate);
    }
}

function renderPreviewList(
    hookReference,
    categoryLabels,
    preferredLanguage,
    projectKey,
    projectDraftDate,
    features,
    addButton = false,
) {
    const container = document.createElement("div");

    container.classList.add("flex", "gap-0.5");

    const list = document.createElement("div");
    list.classList.add("flex", "flex-col", "gap-0.5");

    if (features.length == 0) {
        return list;
    }

    for (let feature of features) {
        list.appendChild(
            renderPreviewIcon(
                hookReference,
                categoryLabels,
                preferredLanguage,
                projectKey,
                projectDraftDate,
                feature,
            ),
        );
    }

    container.appendChild(list);

    if (addButton) {
        const closeButton = document.createElement("button");

        closeButton.classList.add(
            "cursor-pointer",
            "bg-primary",
            "hover:bg-primary-hover",
            "text-primary-inverse",
            "hover:text-primary-inverse-hover",
            "p-1",
            "border",
            "border-black",
        );

        closeButton.appendChild(document.createTextNode("x"));
        closeButton.onclick = (e) => {
            window.dispatchEvent(
                new CustomEvent(
                    `phx:close-preview-list-${hookReference.el.getAttribute("id")}`,
                ),
            );
        };
        container.appendChild(closeButton);
    }
    return container;
}

function renderPreviewIcon(
    hookReference,
    categoryLabels,
    preferredLanguage,
    projectKey,
    projectDraftDate,
    feature,
) {
    const properties = feature.getProperties();

    const preview = document.createElement("div");
    preview.classList.add("border", "border-black", "flex");

    preview.style.maxWidth = `${hookReference.el.clientWidth * 0.5 - 10}px`;

    const categoryLabel = document.createElement("div");
    categoryLabel.classList.add("h-full", "bg-white/60", "p-1", "font-thin");

    categoryLabel.appendChild(
        document.createTextNode(
            `${pickTranslation(categoryLabels[properties.category], preferredLanguage)}`,
        ),
    );

    const categoryInfo = document.createElement("div");
    categoryInfo.classList.add("pl-2", "text-black");
    categoryInfo.style = `background: hsl(from ${properties.color} h calc(s * 0.5) l)`;

    categoryInfo.appendChild(categoryLabel);

    const documentInfo = document.createElement("div");
    documentInfo.classList.add(
        "document-info",
        "grow",
        "p-1",
        "h-full",
        "bg-white",
        "cursor-pointer",
    );

    let documentInfoText = properties.identifier;

    if (Object.keys(properties.description).length > 0) {
        documentInfoText += ` | ${pickTranslation(properties.description, preferredLanguage)}`;
    }

    documentInfo.appendChild(document.createTextNode(documentInfoText));

    documentInfo.addEventListener("click", function (event) {
        return hookReference
            .js()
            .navigate(
                `/projects/${projectKey}/${projectDraftDate}/${properties.uuid}`,
            );
    });

    preview.appendChild(categoryInfo);
    preview.appendChild(documentInfo);

    return preview;
}

export const styleFunction = function (feature) {
    const props = feature.getProperties();
    if (props.type === "Polygon" || props.type === "MultiPolygon") {
        return getPolygonStyle(props);
    } else if (props.type == "LineString" || props.type === "MultiLineString") {
        return getLineStyle(props);
    } else if (props.type == "Point" || props.type === "MultiPoint") {
        return getPointStyle(props);
    } else {
        console.error(`Unknown feature type ${props.type}, no matching style.`);
        return null;
    }
};

function getResolutions(extent, tileSize, width, height) {
    const portraitFormat = height > width;

    const result = [];
    const layerSize =
        extent[portraitFormat ? 3 : 2] - extent[portraitFormat ? 1 : 0];
    const imageSize = portraitFormat ? height : width;

    let scale = 1;
    while (tileSize < imageSize / scale) {
        result.push((layerSize / imageSize) * scale);
        scale *= 2;
    }
    result.push((layerSize / imageSize) * scale);

    return result.reverse();
}

function pickTranslation(options, selected) {
    if (options[selected]) return options[selected];
    if (options["en"]) return options["en"];

    return options[Object.keys(options)[0]];
}

function getPolygonStyle(featureProperties) {
    const [r, g, b, a] = asArray(featureProperties.color);

    let style = new Style({
        stroke: new Stroke({
            color: `rgba(${r}, ${g}, ${b}, ${a})`,
            width: 1,
        }),
    });

    if (featureProperties.fill) {
        style.setFill(
            new Fill({
                color: `rgba(${r * 0.5}, ${g * 0.5}, ${b * 0.5}, 0.5)`,
            }),
        );
        style.setZIndex(500);
    } else {
        style.setFill(
            new Fill({
                color: `rgba(${r}, ${g}, ${b}, 0.0)`,
            }),
        );
        style.setZIndex(0);
    }

    return style;
}

const pointRadius = 5;
const lineWidth = pointRadius * 2;

function getLineStyle(featureProperties) {
    const [r, g, b, a] = asArray(featureProperties.color);

    let color;

    if (featureProperties.fill) {
        color = `rgba(${r}, ${g}, ${b}, 1)`;
    } else {
        color = `rgba(${r}, ${g}, ${b}, 0.5)`;
    }

    return new Style({
        stroke: new Stroke({
            color: color,
            width: lineWidth,
        }),
    });
}

function getPointStyle(featureProperties) {
    const [r, g, b, a] = asArray(featureProperties.color);
    const styles = [];

    styles.push(
        new Style({
            image: new Circle({
                radius: pointRadius,
                stroke: new Stroke({
                    color: `rgba(${r}, ${g}, ${b}, ${a})`,
                    width: 1,
                }),
                fill: new Fill({
                    color: `rgba(${r}, ${g}, ${b}, 1)`,
                }),
            }),
        }),
    );

    if (featureProperties.fill) {
        styles.push(
            new Style({
                image: new Circle({
                    radius: pointRadius * 3,
                    stroke: new Stroke({
                        color: `rgba(${r}, ${g}, ${b}, ${a})`,
                        width: 2,
                    }),
                }),
            }),
        );
        styles.push(
            new Style({
                image: new Circle({
                    radius: pointRadius * 5,
                    stroke: new Stroke({
                        color: `rgba(${r}, ${g}, ${b}, ${a})`,
                        width: 2,
                    }),
                }),
            }),
        );
    }

    return styles;
}
