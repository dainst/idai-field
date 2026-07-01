import Map from "ol/Map.js";
import View from "ol/View.js";
import { createEmpty, extend } from "ol/extent.js";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON.js";

import {
    findFeature,
    highlightFeature,
    clearAllHighlights,
    styleFunction,
} from "./map/features";
import PublicationTileLayers from "./map/tile-layers";
import PreviewOverlay from "./map/preview-overlay";
import PublicationSelection from "./map/selection";
const highlightZoomDuration = -1;

export default (getFullProjectMapHook = () => {
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
        selectionMode: false,
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
                    this.selection.presetSelection(geometry);
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
                    clearAllHighlights(this.featureLayers);
                    this.refitView();

                    this.lastHighlightChange = Date.now();
                }
            });

            this.handleEvent(
                `set-draw-box-mode-${this.el.id}`,
                ({ new_value }) => {
                    this.selectionMode = new_value;
                    if (new_value) {
                        this.selection.startDrawing();
                    } else {
                        this.selection.stopDrawing();
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

            this.map = new Map({
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

            this.selection = new PublicationSelection(this, this.map, () => {
                this.selectionMode = false;
                this.refitView();
            });

            this.map.on("pointermove", async function (e) {
                if (e.dragging || _this.selectionMode) {
                    return;
                }

                if (_this.pinnedFeatures.length == 0) {
                    _this.hoveredFeatures = _this.map.getFeaturesAtPixel(
                        e.pixel,
                        {
                            layerFilter: (layer) => {
                                const properties = layer.getProperties();
                                return properties && !properties.drawLayer;
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
                if (_this.selectionMode) return;

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

        highlightCategories(categories) {
            clearAllHighlights(this.featureLayers);
            const categoryNames = categories
                .replace("categories-", "")
                .split(",");

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
                    highlightFeature(f);
                });
        },

        highlightDocument(uuid) {
            if (
                this.map &&
                Date.now() - this.lastHighlightChange > highlightZoomDuration
            ) {
                clearAllHighlights(this.featureLayers);
                feature = findFeature(uuid, this.map);
                parentId = feature.getProperties().parent;

                if (this.drawnExtent) {
                    this.map
                        .getView()
                        .fit(this.drawnExtent, { padding: [10, 10, 10, 10] });
                } else if (parentId) {
                    parent = findFeature(parentId, this.map);
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

                highlightFeature(feature);
                this.lastHighlightChange = Date.now();
            }
        },

        refitView() {
            if (!this.map | !this.fullVectorExtent) return;

            const selectionExtent = this.selection.getExtent();
            if (selectionExtent) {
                this.map.getView().fit(selectionExtent, {
                    padding: [10, 10, 10, 10],
                });
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
            clearAllHighlights(this.featureLayers);
        },
    };
});
