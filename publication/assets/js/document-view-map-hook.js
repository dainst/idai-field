
import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/Tile.js';
import TileGrid from 'ol/tilegrid/TileGrid';
import View from 'ol/View.js';
import { createEmpty, extend } from 'ol/extent.js';
import { TileImage } from 'ol/source.js';
import { Fill, Stroke, Style } from 'ol/style.js';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import GeoJSON from 'ol/format/GeoJSON.js';
import { asArray } from 'ol/color';
import Overlay from 'ol/Overlay.js';

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

// function getCanvasPattern(color1, color2) {
//     // Create a pattern, offscreen
//     const patternCanvas = document.createElement("canvas");
//     const patternContext = patternCanvas.getContext("2d");

//     // Give the pattern a width and height of 50
//     patternCanvas.width = 100;
//     patternCanvas.height = 100;

//     // // Give the pattern a background color and draw an arc
//     // patternContext.fillStyle = color;
//     // patternContext.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
//     // patternContext.arc(0, 0, 50, 0, 0.5 * Math.PI);
//     // patternContext.stroke();
//     var numberOfStripes = 10;
//     for (var i = 0; i < numberOfStripes * 2; i++) {
//         var thickness = 30;
//         patternContext.beginPath();
//         patternContext.strokeStyle = i % 2 ? color1 : color2;
//         patternContext.lineWidth = thickness;

//         patternContext.moveTo(i * thickness + thickness - 200, 0);
//         patternContext.lineTo(0 + i * thickness + thickness, 200);
//         patternContext.stroke();
//     }

//     // Create our primary canvas and fill it with the pattern
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");
//     const pattern = ctx.createPattern(patternCanvas, "repeat");

//     return pattern;
// }

const tileSize = 256;

const styleFunction = function (feature) {
    const props = feature.getProperties();

    const [r, g, b, a] = asArray(props.color)

    let style = new Style({
        stroke: new Stroke({
            color: `rgba(${r}, ${g}, ${b}, ${a})`,
            width: 1,
        })
    })

    if (props.fill) {
        style.setFill(new Fill({
            color: `rgba(${r * 0.5}, ${g * 0.5}, ${b * 0.5}, 0.5)`,
        }));
        // } else if (props.hatch) {
        //     style.setFill(new Fill({ color: getCanvasPattern(`rgba(${r * 0.5}, ${g * 0.5}, ${b * 0.5}, ${a})`, `rgba(${r}, ${g}, ${b}, 0.2)`) }))
    } else {
        style.setFill(new Fill({
            color: `rgba(${r}, ${g}, ${b}, 0.0)`,
        }));
    }

    return style
};

export default getDocumentViewMapHook = () => {
    return {
        map: null,
        docId: null,
        docLayer: null,
        childrenLayer: null,
        identifierOverlay: null,
        identifierOverlayContent: null,

        mounted() {
            this.handleEvent(
                `document-map-update-${this.el.id}`,
                ({ project, document_feature, children_features, project_tile_layers }) => {
                    this.initialize(); // TODO: Do not initialize on every change.
                    this.setup(project, document_feature, children_features, project_tile_layers)
                }
            )
        },

        initialize() {
            const _this = this;

            this.identifierOverlayContent = document.getElementById(
                `${this.el.getAttribute("id")}-identifier-tooltip-content`
            )
            const overlayDiv = document.getElementById(
                `${this.el.getAttribute("id")}-identifier-tooltip`
            );

            this.identifierOverlay = new Overlay({
                element: overlayDiv
            });

            document.getElementById(`${this.el.getAttribute("id")}-map`).innerHTML = ""

            this.map = new Map({
                target: `${this.el.getAttribute("id")}-map`,
                view: new View(),
                overlays: [this.identifierOverlay]
            });

            this.el.addEventListener('pointerenter', function (e) {
                let docFeature = _this.docLayer.getSource().getFeatures()[0];
                let properties = docFeature.getProperties();
                properties.fill = false;
                docFeature.setProperties(properties);
            });

            this.el.addEventListener('pointerleave', function (e) {
                let docFeature = _this.docLayer.getSource().getFeatures()[0];
                let properties = docFeature.getProperties();
                properties.fill = true;
                docFeature.setProperties(properties);

                let childFeatures = _this.childrenLayer.getSource().getFeatures();

                for (let child of childFeatures) {
                    let properties = child.getProperties();
                    properties.fill = false;
                    child.setProperties(properties);

                    _this.identifierOverlayContent.innerHTML = "";
                }
            });

            this.map.on('pointermove', function (e) {
                let childFeatures = _this.childrenLayer.getSource().getFeatures();

                for (let child of childFeatures) {
                    let properties = child.getProperties();
                    properties.fill = false;
                    child.setProperties(properties);

                    _this.identifierOverlayContent.innerHTML = null;
                }

                _this.map.forEachFeatureAtPixel(
                    e.pixel,
                    function (feature) {
                        let properties = feature.getProperties()

                        properties.fill = true;
                        feature.setProperties(properties);

                        _this.identifierOverlayContent.innerHTML = properties.identifier;

                        const [r, g, b, a] = asArray(properties.color)

                        _this.identifierOverlayContent.style.background = `rgba(${r}, ${g}, ${b}, 0.8)`;
                        _this.identifierOverlay.setPosition(e.coordinate);
                    },
                    {
                        layerFilter: function (layer) {
                            return layer.get('name') === 'childLayer';
                        }
                    }
                );
            });

            this.map.on('singleclick', function (e) {
                console.log(e);

                _this.map.forEachFeatureAtPixel(
                    e.pixel,
                    function (feature) {
                        console.log("click");
                        let properties = feature.getProperties()

                        _this.pushEvent("geometry-clicked", { uuid: properties.uuid })
                    },
                    {
                        layerFilter: function (layer) {
                            console.log(layer.get('name'))
                            return layer.get('name') === 'childLayer';
                        }
                    }
                );
            })

        },
        async setup(project, documentFeature, childrenFeatures, projectTileLayers) {
            this.docId = null
            this.docLayer = null
            this.childrenLayer = null

            let aggregatedExtent = createEmpty();

            this.docId = documentFeature.properties.uuid;

            try {
                for (let layerInfo of projectTileLayers) {
                    const geoReference = layerInfo.extent;

                    const extent = [
                        geoReference.bottomLeftCoordinates[1],
                        geoReference.bottomLeftCoordinates[0],
                        geoReference.topRightCoordinates[1],
                        geoReference.topRightCoordinates[0]
                    ];

                    const pathTemplate = `/api/image/tile/${project}/${layerInfo.uuid}/{z}/{x}/{y}`;

                    const resolutions = getResolutions(extent, tileSize, layerInfo.width, layerInfo.height)

                    let source = new TileImage({
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

                    let currentLayer = new TileLayer({
                        source: source,
                        extent
                    });

                    this.map.addLayer(currentLayer);

                    aggregatedExtent = extend(aggregatedExtent, extent);
                }
                documentFeature.properties.fill = true;

                console.log(documentFeature)

                const vectorSource = new VectorSource({
                    features: new GeoJSON().readFeatures(documentFeature)
                })

                this.docLayer = new VectorLayer({
                    source: vectorSource,
                    style: styleFunction,
                });

                aggregatedExtent = extend(aggregatedExtent, vectorSource.getExtent())

                let extent = vectorSource.getExtent();

                this.map.addLayer(this.docLayer);

                const additionalVectorSource = new VectorSource({
                    features: new GeoJSON().readFeatures(childrenFeatures)
                })

                this.childrenLayer = new VectorLayer({
                    name: "childLayer",
                    source: additionalVectorSource,
                    style: styleFunction,
                });

                this.map.addLayer(this.childrenLayer);

                aggregatedExtent = extend(aggregatedExtent, additionalVectorSource.getExtent())

                if (extent[0] === Infinity) {
                    // TODO: This is a weird fallback for cases where no highlight is present. This should probably 
                    // first fallback to additionalVectorSource's extent.
                    extent = aggregatedExtent;
                }


                this.map.getView().fit(aggregatedExtent, { padding: [10, 10, 10, 10] });
                this.map.setView(new View({ extent: this.map.getView().calculateExtent(this.map.getSize()) }));
                this.map.getView().fit(extent, { padding: [10, 10, 10, 10] });

                // this.map.setView(view);

                // this.map.getView().fit(extent, { padding: [100, 100, 100, 100] })
                // this.map.setView(view);
            }
            catch (e) {
                console.error(e)
            }
        }
    }
}