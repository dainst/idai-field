
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

const tileSize = 256;

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

const styleFunction = function (feature) {
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

export default getDocumentViewMapHook = () => {
    return {
        map: null,
        // layerControl: null,
        docId: null,
        projectTileLayers: [],
        parentLayer: null,
        docLayer: null,
        childrenLayer: null,
        identifierOverlay: null,
        identifierOverlayContent: null,

        mounted() {
            console.log("mount")
            this.initialize();
            this.handleEvent(
                `document-map-set-project-layers-${this.el.id}`,
                ({ project, project_tile_layers }) => {
                    this.setProjectLayers(project, project_tile_layers)
                }
            )
            this.handleEvent(
                `document-map-update-${this.el.id}`,
                ({ document_feature, children_features, parent_features }) => {
                    this.setMapFeatures(parent_features, document_feature, children_features)
                }
            )
            this.handleEvent(
                `document-map-set-layer-visibility-${this.el.id}`,
                ({ uuid, visibility }) => {
                    this.toggleLayerVisibility(uuid, visibility)
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
                overlays: [this.identifierOverlay],
            });

            _this.identifierOverlay.setPosition(undefined)

            this.el.addEventListener('pointerenter', function (e) {
                _this.setFillForSelectedDocument(false);
            });

            this.el.addEventListener('pointerleave', function (e) {
                _this.setFillForParents(false);
                _this.setFillForSelectedDocument(true);
                _this.setFillForChildren(false);
            });

            this.map.on('pointermove', function (e) {

                _this.setFillForChildren(false);
                _this.setFillForParents(false);
                _this.identifierOverlay.setPosition(undefined)

                if (e.dragging) {
                    return;
                }

                _this.childrenLayer.getFeatures(e.pixel).then(function (features) {
                    const childFeature = features.length ? features[0] : undefined;
                    if (childFeature) {
                        _this.highlightFeature(childFeature, e.coordinate)
                    } else {
                        _this.parentLayer.getFeatures(e.pixel).then(function (features) {
                            const parentFeature = features.length ? features[0] : undefined;
                            if (parentFeature) {
                                _this.highlightFeature(parentFeature, e.coordinate)
                            };
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
        setProjectLayers(projectName, tileLayersInfo) {

            this.projectTileLayerExtent = createEmpty();
            this.projectTileLayers = [];

            for (let info of tileLayersInfo) {
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

                const currentLayer = new TileLayer({
                    name: info.uuid,
                    source: source,
                    extent
                })

                this.projectTileLayers.push(currentLayer);

                this.projectTileLayerExtent = extend(this.projectTileLayerExtent, extent);
                this.map.addLayer(currentLayer);
            }
        },
        async setMapFeatures(parentFeatures, documentFeature, childrenFeatures) {
            this.docId = documentFeature.properties.uuid;

            if (this.childrenLayer) this.map.removeLayer(this.childrenLayer);
            if (this.docLayer) this.map.removeLayer(this.docLayer);
            if (this.parentLayer) this.map.removeLayer(this.parentLayer);

            const parentVectorSource = new VectorSource({
                features: new GeoJSON().readFeatures(parentFeatures)
            })

            this.parentLayer = new VectorLayer({
                name: "parentLayer",
                source: parentVectorSource,
                style: styleFunction,
            });

            this.map.addLayer(this.parentLayer);

            documentFeature.properties.fill = true;

            const vectorSource = new VectorSource({
                features: new GeoJSON().readFeatures(documentFeature)
            })

            this.docLayer = new VectorLayer({
                source: vectorSource,
                style: styleFunction,
            });

            this.map.addLayer(this.docLayer);

            const childrenVectorSource = new VectorSource({
                features: new GeoJSON().readFeatures(childrenFeatures)
            })

            this.childrenLayer = new VectorLayer({
                name: "childLayer",
                source: childrenVectorSource,
                style: styleFunction
            });

            this.map.addLayer(this.childrenLayer);

            aggregatedExtent = extend(this.projectTileLayerExtent, parentVectorSource.getExtent())
            aggregatedExtent = extend(aggregatedExtent, vectorSource.getExtent())
            aggregatedExtent = extend(aggregatedExtent, childrenVectorSource.getExtent())

            let extent;

            if (parentFeatures.features.length !== 0) {
                extent = parentVectorSource.getExtent();
            } else if ('geometry' in documentFeature) {
                extent = vectorSource.getExtent();
            } else if (childrenFeatures.features.length !== 0) {
                extent = childrenVectorSource.getExtent();
            } else {
                extent = aggregatedExtent;
            }

            this.map.getView().fit(aggregatedExtent, { padding: [10, 10, 10, 10] });
            this.map.setView(new View({
                extent: this.map.getView().calculateExtent(this.map.getSize()),
                maxZoom: 40
            }));
            this.map.getView().fit(extent, { padding: [10, 10, 10, 10] });

            this.clearAllHighlights()
        },
        highlightFeature(feature, coordinate) {
            let properties = feature.getProperties()

            properties.fill = true;
            feature.setProperties(properties);

            this.identifierOverlayContent.innerHTML = `${properties.identifier} | ${properties.description}`;

            const [r, g, b, a] = asArray(properties.color)
            document.getElementById(`${this.el.getAttribute("id")}-identifier-tooltip-category-bar`).style.background = `rgba(${r}, ${g}, ${b})`
            document.getElementById(`${this.el.getAttribute("id")}-identifier-tooltip-category-content`).innerHTML = properties.category;

            this.identifierOverlay.setPosition(coordinate);
        },
        setFillForParents(val) {
            let parentFeatures = this.parentLayer.getSource().getFeatures();
            for (let parent of parentFeatures) {
                let properties = parent.getProperties();
                properties.fill = val;
                parent.setProperties(properties);
            }
        },
        setFillForSelectedDocument(val) {
            let docFeature = this.docLayer.getSource().getFeatures()[0];
            let properties = docFeature.getProperties();
            properties.fill = val;
            docFeature.setProperties(properties);
        },
        setFillForChildren(val) {
            let childFeatures = this.childrenLayer.getSource().getFeatures();
            for (let child of childFeatures) {
                let properties = child.getProperties();
                properties.fill = val;
                child.setProperties(properties);
            }
        },
        clearAllHighlights() {
            this.setFillForSelectedDocument(false);
            this.setFillForChildren(false);
        },
        toggleLayerVisibility(uuid, visibility) {
            const layer = this.map.getLayers().getArray().find(layer => layer.get('name') == uuid)
            if (layer) layer.setVisible(visibility)
        }
    }
}