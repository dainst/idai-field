import Map from "ol/Map.js";
import View from "ol/View.js";
import { createEmpty, extend } from "ol/extent.js";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON.js";
import Draw from "ol/interaction/Draw.js";
import { Fill, Stroke } from "ol/style.js";
import Style from "ol/style/Style.js";

import { styleFunction } from "./map/styles";
import PublicationTileLayers from "./map/tile-layers";
import PreviewOverlay from "./map/preview-overlay";

const highlightZoomDuration = -1;

export default getFullProjectMapHook = () => {
    return {
        id: null,
        map: null,
        projectKey: null,
        draftDate: null,
        publicationTileLayers: null,
        featureLayers: [],
        fullVectorExtent: null,
        lastHighlightChange: Date.now(),
        hoveredFeatures: [],
        pinnedFeatures: [],
        categoryLabels: {},
        drawBoxMode: false,
        draw: null,
        drawSource: null,
        drawLayer: null,
        overlay: null,

        mounted() {
            this.initialize();
            this.handleEvent(
                `full-project-map-set-layers-${this.el.id}`,
                ({ project_tile_layers }) => {
                    this.publicationTileLayers.setProjectLayers(
                        project_tile_layers,
                    );
                },
            );

            this.handleEvent(
                `full-project-map-set-layer-visibility-${this.el.id}`,
                ({ uuid, visibility }) => {
                    this.publicationTileLayers.toggleLayerVisibility(
                        uuid,
                        visibility,
                    );
                },
            );

            this.handleEvent(
                `full-project-map-data-${this.el.id}`,
                ({ feature_collections }) => {
                    this.setMapFeatures(feature_collections);
                },
            );

            this.handleEvent(
                `render-selection-polygon-${this.el.id}`,
                ({ geometry }) => {
                    this.setSelectionPolygon(geometry);
                },
            );

            this.handleEvent(
                `map-highlight-feature-${this.el.id}`,
                ({ feature_id }) => {
                    if (this.map) {
                        if (feature_id.startsWith("categories-")) {
                            this.highlightCategories(feature_id);
                        } else {
                            this.highlightDocument(feature_id);
                        }
                    }
                },
            );

            this.handleEvent(`close-preview-list-${this.el.id}`, () => {
                if (this.map) {
                    this.pinnedFeatures = [];
                    this.overlay.update([]);
                }
            });

            this.handleEvent(`map-clear-highlights-${this.el.id}`, () => {
                if (this.map) {
                    this.clearHighlights();
                    this.refitView();

                    this.lastHighlightChange = Date.now();
                }
            });

            this.handleEvent(
                `set-draw-box-mode-${this.el.id}`,
                ({ new_value }) => {
                    this.drawBoxMode = new_value;
                    if (new_value == true) {
                        this.pinnedFeatures = [];
                        this.hoveredFeatures = [];

                        this.overlay.update([]);

                        this.draw = new Draw({
                            source: this.drawSource,
                            type: "Polygon",
                            // style while drawing polygons
                            style: {
                                "circle-radius": 5,
                                "circle-fill-color": `rgba(255, 0, 0, 1)`,
                                "stroke-color": `rgba(0, 0, 0, 1)`,
                                "stroke-width": 2,
                                "fill-color": `rgba(255, 255, 255, 0.5)`,
                            },
                        });

                        this.draw.once("drawend", ({ feature }) => {
                            this.drawSource.clear();
                            this.pushEventTo(this.el, "drawn-selection", {
                                coordinates: feature
                                    .getGeometry()
                                    .getCoordinates(),
                            });
                            this.drawBoxMode = new_value;
                            this.map.removeInteraction(this.draw);
                            this.drawnExtent = feature
                                .getGeometry()
                                .getExtent();

                            this.refitView();
                        });

                        this.map.addInteraction(this.draw);
                    } else {
                        this.map.removeInteraction(this.draw);
                    }
                },
            );
        },
        async initialize() {
            this.id = this.el.getAttribute("id");
            this.projectKey = this.el.getAttribute("project_key");
            this.draftDate = this.el.getAttribute("draft_date");
            this.language = this.el.getAttribute("language");

            const _this = this;
            const container = document.getElementById(`${this.id}-map`);

            if (this.el.getAttribute("offset_base_element")) {
                const offsetElement = document.getElementById(
                    this.el.getAttribute("offset_base_element"),
                );
                container.style.height = `${window.innerHeight - offsetElement.offsetTop}px`;
            }

            this.drawSource = new VectorSource({
                wrapX: false,
            });

            this.drawLayer = new VectorLayer({
                source: this.drawSource,
                // style for finished polygons
                style: new Style({
                    stroke: new Stroke({
                        color: `rgba(0, 0, 0, 1)`,
                        width: 1,
                    }),
                    fill: new Fill({
                        color: `rgba(255, 255, 255, 0.5)`,
                    }),
                }),
                properties: {
                    drawn: true,
                },
            });

            this.map = new Map({
                layers: [this.drawLayer],
                target: `${this.id}-map`,
                view: new View(),
            });

            const overlayDiv = document.getElementById(
                `${this.el.getAttribute("id")}-identifier-tooltip`,
            );

            this.overlay = new PreviewOverlay(
                this,
                this.map,
                overlayDiv,
                this.projectKey,
                this.draftDate,
            );

            this.publicationTileLayers = new PublicationTileLayers(
                this,
                this.map,
                this.projectKey,
                this.draftDate,
            );

            this.map.on("pointermove", async function (e) {
                if (e.dragging || _this.drawBoxMode) {
                    return;
                }

                if (_this.pinnedFeatures.length == 0) {
                    _this.hoveredFeatures = _this.map.getFeaturesAtPixel(
                        e.pixel,
                        {
                            layerFilter: (layer) => {
                                const properties = layer.getProperties();
                                return properties && !properties.drawn;
                            },
                        },
                    );

                    _this.overlay.update(
                        _this.hoveredFeatures,
                        _this.categoryLabels,
                        e.coordinate,
                        _this.language,
                    );
                }
            });

            this.map
                .getTargetElement()
                .addEventListener("pointerleave", function (e) {
                    _this.overlay.hide();
                });

            this.map.on("singleclick", async function (e) {
                if (_this.drawBoxMode) return;

                if (_this.hoveredFeatures.length > 1) {
                    _this.pinnedFeatures = _this.hoveredFeatures;
                    _this.hoveredFeatures = [];
                    _this.overlay.update(
                        _this.pinnedFeatures,
                        _this.categoryLabels,
                        e.coordinate,
                        _this.language,
                        true,
                    );
                } else if (_this.hoveredFeatures.length === 1) {
                    const properties = _this.hoveredFeatures[0].getProperties();
                    _this
                        .js()
                        .navigate(
                            `/projects/${_this.projectKey}/${_this.draftDate}/${properties.uuid}`,
                        );

                    _this.identifierOverlay.setPosition(undefined);
                }
            });

            const response = await fetch(
                `/api/json/geometry_feature_collections/${this.projectKey}/${this.draftDate}`,
            );
            const { category_labels, feature_collections } =
                await response.json();

            this.categoryLabels = category_labels;

            this.setMapFeatures(feature_collections);

            document.getElementById(
                `${this.id}-loading-indicator`,
            ).style.display = "none";
        },

        setSelectionPolygon(geometry) {
            this.drawSource.clear();

            if (geometry != null) {
                feature = new GeoJSON().readFeature({
                    type: "Feature",
                    geometry: {
                        type: "Polygon",
                        coordinates: [geometry],
                    },
                });

                this.drawSource.addFeature(feature);
                this.drawnExtent = feature.getGeometry().getExtent();
            } else {
                this.drawnExtent = null;
            }

            this.refitView();
        },

        highlightCategories(categories) {
            const _this = this;

            const categoryNames = categories
                .replace("categories-", "")
                .split(",");

            this.clearHighlights();
            const vectorLayerFeatures = this.map
                .getAllLayers()
                .filter((layer) => layer instanceof VectorLayer)
                .map((layer) => layer.getSource().getFeatures())
                .flat();

            vectorLayerFeatures
                .filter(function (f) {
                    return (
                        categoryNames.indexOf(f.getProperties().category) > -1
                    );
                })
                .map(function (f) {
                    _this.highlightFeature(f);
                });
        },

        highlightDocument(uuid) {
            if (
                this.map &&
                Date.now() - this.lastHighlightChange > highlightZoomDuration
            ) {
                this.clearHighlights();
                feature = this.findFeature(uuid);
                parentId = feature.getProperties().parent;

                if (this.drawnExtent) {
                    this.map
                        .getView()
                        .fit(this.drawnExtent, { padding: [10, 10, 10, 10] });
                } else if (parentId) {
                    parent = this.findFeature(parentId);
                    if (parent) {
                        this.map
                            .getView()
                            .fit(parent.getGeometry().getExtent(), {
                                padding: [10, 10, 10, 10],
                                duration: highlightZoomDuration,
                            });
                    } else if (feature.getProperties().type != "Point") {
                        this.map
                            .getView()
                            .fit(feature.getGeometry().getExtent(), {
                                padding: [10, 10, 10, 10],
                                duration: highlightZoomDuration,
                            });
                    } else {
                        console.log(
                            `No geometry or parent geometry to zoom to for ${uuid}`,
                        );
                    }
                } else {
                    this.map.getView().fit(feature.getGeometry().getExtent(), {
                        padding: [10, 10, 10, 10],
                        duration: highlightZoomDuration,
                    });
                }

                this.highlightFeature(feature);
                this.lastHighlightChange = Date.now();
            }
        },

        clearHighlights() {
            for (const index in this.featureLayers) {
                let features = this.featureLayers[index]
                    .getSource()
                    .getFeatures();

                for (let feature of features) {
                    let properties = feature.getProperties();
                    properties.fill = false;
                    feature.setProperties(properties);
                }
            }
        },

        highlightFeature(feature) {
            let properties = feature.getProperties();
            properties.fill = true;

            feature.setProperties(properties);
        },

        findFeature(uuid) {
            const vectorLayerFeatures = this.map
                .getAllLayers()
                .filter((layer) => layer instanceof VectorLayer)
                .map((layer) => layer.getSource().getFeatures())
                .flat();

            return vectorLayerFeatures.find(function (f) {
                return f.getProperties().uuid == uuid;
            });
        },

        refitView() {
            if (!this.map | !this.fullVectorExtent) return;
            if (this.drawnExtent) {
                this.map
                    .getView()
                    .fit(this.drawnExtent, { padding: [10, 10, 10, 10] });
            } else {
                this.map
                    .getView()
                    .fit(this.fullVectorExtent, { padding: [10, 10, 10, 10] });
            }
        },

        setMapFeatures(featureCollections) {
            for (const index in this.featureLayers) {
                this.map.removeLayer(this.featureLayer[index]);
            }
            this.featureLayers = [];

            this.fullVectorExtent = createEmpty();

            for (let key in featureCollections) {
                let collection = featureCollections[key];
                const vectorSource = new VectorSource({
                    features: new GeoJSON().readFeatures(collection),
                });

                const featureLayer = new VectorLayer({
                    name: key,
                    source: vectorSource,
                    style: styleFunction,
                });

                this.featureLayers.push(featureLayer);
                this.map.addLayer(featureLayer);

                extend(this.fullVectorExtent, vectorSource.getExtent());
            }

            let fullExtent = createEmpty();

            fullExtent = extend(fullExtent, this.fullVectorExtent);
            fullExtent = extend(
                fullExtent,
                this.publicationTileLayers.getExtents().project,
            );

            this.map.getView().fit(fullExtent, { padding: [10, 10, 10, 10] });
            this.map.setView(
                new View({
                    extent: this.map
                        .getView()
                        .calculateExtent(this.map.getSize()),
                    maxZoom: 40,
                }),
            );

            this.refitView();
            this.clearHighlights();
        },
    };
};
