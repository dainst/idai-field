
import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/Tile.js';
import TileGrid from 'ol/tilegrid/TileGrid';
import View from 'ol/View.js';
import { createEmpty, extend } from 'ol/extent.js';
import { TileImage } from 'ol/source.js';
import { Fill, Stroke, Style, Circle } from 'ol/style.js';
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

const tileSize = 256;

const styleFunction = function (feature) {
    const props = feature.getProperties();

    let style = null

    if (props.type === "Polygon" || props.type === "MultiPolygon") {

        const [r, g, b, a] = asArray(props.color)

        style = new Style({
            stroke: new Stroke({
                color: `rgba(${r}, ${g}, ${b}, ${a})`,
                width: 1,
            })
        })

        if (props.fill) {
            style.setFill(new Fill({
                color: `rgba(${r * 0.5}, ${g * 0.5}, ${b * 0.5}, 0.5)`,
            }));
        } else {
            style.setFill(new Fill({
                color: `rgba(${r}, ${g}, ${b}, 0.0)`,
            }));
        }
    } else if (props.type == "Point") {
        const [r, g, b, a] = asArray(props.color)

        let image = new Circle({
            radius: 7,
            stroke: new Stroke({
                color: `rgba(${r}, ${g}, ${b}, ${a})`,
                width: 1,
            })
        })

        if (props.fill) {
            image.setFill(new Fill({
                color: `rgba(${r * 0.5}, ${g * 0.5}, ${b * 0.5}, 0.5)`,
            }));
        } else {
            image.setFill(new Fill({
                color: `rgba(${r}, ${g}, ${b}, 0.05)`,
            }));
        }

        style = new Style({
            image: image
        })
    } else {
        console.error(`Unknown feature type ${props.type}, no matching styling.`)
    }

    return style
};

export default getDocumentViewMapHook = () => {
    return {
        map: null,
        docId: null,
        parentLayer: null,
        docLayer: null,
        childrenLayer: null,
        identifierOverlay: null,
        identifierOverlayContent: null,

        mounted() {
            this.handleEvent(
                `document-map-update-${this.el.id}`,
                ({ project, document_feature, children_features, parent_features, project_tile_layers }) => {
                    this.initialize(); // TODO: Do not initialize on every change.
                    this.setup(project, parent_features, document_feature, children_features, project_tile_layers)
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
                element: overlayDiv,
                offset: [5, 5]
            });

            document.getElementById(`${this.el.getAttribute("id")}-map`).innerHTML = ""

            this.map = new Map({
                target: `${this.el.getAttribute("id")}-map`,
                view: new View(),
                overlays: [this.identifierOverlay]
            });

            _this.identifierOverlay.setPosition(undefined)

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
                }

                _this.identifierOverlay.setPosition(undefined)
            });

            this.map.on('pointermove', function (e) {
                let childFeatures = _this.childrenLayer.getSource().getFeatures();
                for (let child of childFeatures) {
                    let properties = child.getProperties();
                    properties.fill = false;
                    child.setProperties(properties);
                }

                let parentFeatures = _this.parentLayer.getSource().getFeatures();
                for (let parent of parentFeatures) {
                    let properties = parent.getProperties();
                    properties.fill = false;
                    parent.setProperties(properties);
                }

                _this.identifierOverlay.setPosition(undefined)

                if (e.dragging) {
                    return;
                }

                _this.childrenLayer.getFeatures(e.pixel).then(function (features) {
                    const feature = features.length ? features[0] : undefined;

                    if (feature) {
                        let properties = feature.getProperties()

                        properties.fill = true;
                        feature.setProperties(properties);

                        _this.identifierOverlayContent.innerHTML = `${properties.identifier} | ${properties.description}`;

                        const [r, g, b, a] = asArray(properties.color)

                        document.getElementById(`${_this.el.getAttribute("id")}-identifier-tooltip-category-bar`).style.background = `rgba(${r}, ${g}, ${b})`
                        document.getElementById(`${_this.el.getAttribute("id")}-identifier-tooltip-category-content`).innerHTML = properties.category

                        _this.identifierOverlay.setPosition(e.coordinate);
                    } else {
                        _this.parentLayer.getFeatures(e.pixel).then(function (features) {
                            const feature = features.length ? features[0] : undefined;
                            if (feature) {
                                let properties = feature.getProperties()

                                properties.fill = true;
                                feature.setProperties(properties);

                                _this.identifierOverlayContent.innerHTML = `${properties.identifier} | ${properties.description}`;

                                const [r, g, b, a] = asArray(properties.color)
                                document.getElementById(`${_this.el.getAttribute("id")}-identifier-tooltip-category-bar`).style.background = `rgba(${r}, ${g}, ${b})`
                                document.getElementById(`${_this.el.getAttribute("id")}-identifier-tooltip-category-content`).innerHTML = properties.category;

                                _this.identifierOverlay.setPosition(e.coordinate);
                            }
                        })
                    }
                })

            });

            this.map.on('singleclick', function (e) {

                _this.childrenLayer.getFeatures(e.pixel).then(function (features) {
                    const feature = features.length ? features[0] : undefined;

                    if (feature) {
                        let properties = feature.getProperties()
                        _this.pushEvent("geometry-clicked", { uuid: properties.uuid })
                    } else {
                        _this.parentLayer.getFeatures(e.pixel).then(function (features) {
                            const feature = features.length ? features[0] : undefined;
                            if (feature) {
                                let properties = feature.getProperties()
                                _this.pushEvent("geometry-clicked", { uuid: properties.uuid })
                            }
                        })
                    }
                })

            })
        },
        async setup(project, parentFeatures, documentFeature, childrenFeatures, projectTileLayers) {
            this.docId = null
            this.docLayer = null
            this.childrenLayer = null

            let aggregatedExtent = createEmpty();

            this.docId = documentFeature.properties.uuid;

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

            const parentVectorSource = new VectorSource({
                features: new GeoJSON().readFeatures(parentFeatures)
            })

            this.parentLayer = new VectorLayer({
                name: "parentLayer",
                source: parentVectorSource,
                style: styleFunction,
            });

            this.map.addLayer(this.parentLayer);

            aggregatedExtent = extend(aggregatedExtent, parentVectorSource.getExtent())

            documentFeature.properties.fill = true;

            const vectorSource = new VectorSource({
                features: new GeoJSON().readFeatures(documentFeature)
            })

            this.docLayer = new VectorLayer({
                source: vectorSource,
                style: styleFunction,
            });

            aggregatedExtent = extend(aggregatedExtent, vectorSource.getExtent())

            this.map.addLayer(this.docLayer);

            const additionalVectorSource = new VectorSource({
                features: new GeoJSON().readFeatures(childrenFeatures)
            })

            this.childrenLayer = new VectorLayer({
                name: "childLayer",
                source: additionalVectorSource,
                style: styleFunction
            });

            this.map.addLayer(this.childrenLayer);

            aggregatedExtent = extend(aggregatedExtent, additionalVectorSource.getExtent())

            let extent = aggregatedExtent;

            if (parentFeatures.features.length !== 0) {
                extent = parentVectorSource.getExtent();
            } else if (vectorSource.getExtent()) {
                extent = vectorSource.getExtent();
            }

            this.map.getView().fit(aggregatedExtent, { padding: [10, 10, 10, 10] });
            this.map.setView(new View({
                extent: this.map.getView().calculateExtent(this.map.getSize()),
                maxZoom: 40
            }));
            this.map.getView().fit(extent, { padding: [10, 10, 10, 10] });

            // this.map.setView(view);

            // this.map.getView().fit(extent, { padding: [100, 100, 100, 100] })
            // this.map.setView(view);

        }
    }
}