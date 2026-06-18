import { Fill, Stroke, Style, Circle } from "ol/style.js";
import { asArray } from "ol/color";
import Feature from "ol/Feature";

const pointRadius = 5;
const lineWidth = pointRadius * 2;

export const styleFunction = function (feature: Feature) {
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

function getPolygonStyle(properties: { [key: string]: any }) {
    const [r, g, b, a] = asArray(properties.color);

    let style = new Style({
        stroke: new Stroke({
            color: `rgba(${r}, ${g}, ${b}, ${a})`,
            width: 1,
        }),
    });

    if (properties.fill) {
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

function getLineStyle(properties: { [key: string]: any }) {
    const [r, g, b, a] = asArray(properties.color);

    let styleColor: string;

    if (properties.fill) {
        styleColor = `rgba(${r}, ${g}, ${b}, 1)`;
    } else {
        styleColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
    }

    return new Style({
        stroke: new Stroke({
            color: styleColor,
            width: lineWidth,
        }),
    });
}

function getPointStyle(properties: { [key: string]: any }) {
    const [r, g, b, a] = asArray(properties.color);
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

    if (properties.fill) {
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
