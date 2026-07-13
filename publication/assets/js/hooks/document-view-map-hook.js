import Map from "ol/Map.js";
import View from "ol/View.js";
import { createEmpty, extend, isEmpty } from "ol/extent.js";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON.js";

import {
    styleFunction,
    setFillForLayer,
    clearAllHighlights,
    highlightFeature,
    getDefaultAlpha,
} from "./map/features";
import PublicationTileLayers from "./map/tile-layers";
import PreviewOverlay from "./map/preview-overlay.js";
import PublicationSelection from "./map/selection";

export default getDocumentViewMapHook = () => {
    return {
        map: null,
        projectKey: null,
        draftDate: null,
        publicationTileLayers: null,
        docId: null,
        setupDone: false,
        nothingToShow: true,
        linkedDocIds: [],
        categoriesMetadata: [],
        mainFeature: null,
        featureLayers: [],
        hoveredFeatures: [],
        pinnedFeatures: [],
        selectionMode: false,
        activeVectorExtent: null,
        fullExtent: null, // includes vector extent + the tile layers (map background images)
        mounted() {
            this.initialize();
            this.handleEvent(
                `document-map-set-project-layers-${this.el.id}`,
                ({ project_tile_layers }) => {
                    this.publicationTileLayers.setProjectLayers(
                        project_tile_layers,
                    );
                },
            );
            this.handleEvent(
                `document-map-set-document-layers-${this.el.id}`,
                ({ document_tile_layers }) => {
                    this.publicationTileLayers.setDocumentLayers(
                        document_tile_layers,
                    );
                },
            );

            this.handleEvent(
                `document-map-set-layer-visibility-${this.el.id}`,
                ({ uuid, visibility }) => {
                    this.publicationTileLayers.toggleLayerVisibility(
                        uuid,
                        visibility,
                    );
                },
            );

            this.handleEvent(
                `document-map-update-${this.el.id}`,
                ({ uuid, linked_uuids }) => {
                    this.docId = uuid;
                    this.linkedDocIds = linked_uuids;

                    this.resetActiveVectorExtent();
                    this.resetFeatures();
                },
            );

            this.handleEvent(
                `map-highlight-feature-${this.el.id}`,
                ({ feature_id }) => {
                    clearAllHighlights(this.featureLayers);
                    const vectorLayerFeatures = this.map
                        .getAllLayers()
                        .filter((layer) => layer instanceof VectorLayer)
                        .map((layer) => layer.getSource().getFeatures())
                        .flat();

                    const feature = vectorLayerFeatures.find(function (f) {
                        return f.getProperties().uuid == feature_id;
                    });

                    if (feature) highlightFeature(feature, 0.5);
                },
            );

            this.handleEvent(`close-preview-list-${this.el.id}`, () => {
                if (this.map) {
                    this.pinnedFeatures = [];
                    this.overlay.update(this.pinnedFeatures);
                    this.updateTooltip(this.pinnedFeatures);
                }
            });

            this.handleEvent(`map-clear-highlights-${this.el.id}`, () => {
                this.resetFeatures();
            });

            this.handleEvent(
                `render-selection-polygon-${this.el.id}`,
                ({ geometry }) => {
                    this.selection.presetSelection(geometry);
                },
            );

            this.handleEvent(
                `set-draw-box-mode-${this.el.id}`,
                ({ new_value }) => {
                    this.selectionMode = new_value;
                    if (new_value == true) {
                        this.pinnedFeatures = [];
                        this.hoveredFeatures = [];

                        this.overlay.update([]);
                        this.selection.startDrawing();
                    } else {
                        this.selection.stopDrawing();
                    }
                },
            );
        },

        async initialize() {
            const _this = this;
            this.id = this.el.getAttribute("id");

            this.docId = this.el.getAttribute("initial_uuid");
            this.linkedDocIds = this.el
                .getAttribute("initial_linked")
                .split("|");

            this.projectKey = this.el.getAttribute("project_key");
            this.draftDate = this.el.getAttribute("draft_date");
            this.language = this.el.getAttribute("language");

            this.map = new Map({
                target: `${this.el.getAttribute("id")}-map`,
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

            this.selection = new PublicationSelection(this.map, (result) => {
                if (result.geometry) {
                    this.pushEventTo(this.el, "drawn-selection", {
                        coordinates: result.geometry,
                    });
                } else {
                    this.selectionMode = false;
                    this.resetFeatures();
                }
            });

            this.el.addEventListener("pointerenter", function (e) {
                setFillForLayer(_this.docLayer, false);
            });

            this.el.addEventListener("pointerleave", function (e) {
                if (_this.pinnedFeatures.length === 0) {
                    _this.resetFeatures();
                    _this.overlay.hide();
                }
            });

            this.map.on("pointermove", async function (e) {
                if (
                    e.dragging ||
                    _this.selectionMode ||
                    _this.pinnedFeatures.length != 0
                ) {
                    return;
                }

                clearAllHighlights(_this.featureLayers);

                const hitFeatures = _this.map.getFeaturesAtPixel(e.pixel, {
                    layerFilter: (layer) => {
                        const properties = layer.getProperties();
                        return (
                            properties &&
                            !properties.mainDocumentLayer &&
                            !properties.drawn
                        );
                    },
                });

                _this.hoveredFeatures = hitFeatures;

                for (feature of _this.hoveredFeatures) {
                    highlightFeature(feature);
                }

                if (e.coordinate) {
                    _this.overlay.update(
                        hitFeatures,
                        _this.categoriesMetadata,
                        e.coordinate,
                        _this.language,
                    );
                }
            });

            this.map.on("singleclick", async function (e) {
                if (_this.selectionMode) return;

                if (_this.hoveredFeatures.length > 1) {
                    _this.pinnedFeatures = _this.hoveredFeatures;
                    _this.hoveredFeatures = [];
                    _this.overlay.update(
                        _this.pinnedFeatures,
                        _this.categoriesMetadata,
                        e.coordinate,
                        _this.language,
                        true,
                    );
                } else if (_this.hoveredFeatures.length === 1) {
                    const properties = _this.hoveredFeatures[0].getProperties();
                    _this
                        .js()
                        .patch(
                            `/projects/${_this.projectKey}/${_this.draftDate}/${properties.uuid}`,
                        );
                    _this.overlay.hide();
                }
            });

            this.map
                .getTargetElement()
                .addEventListener("pointerleave", function (e) {
                    // Hides the overlay if no pinned features and mouse is completely off the map.
                    if (_this.pinnedFeatures.length === 0) {
                        _this.overlay.hide();
                    }
                });

            const response = await fetch(
                `/api/json/geometry_feature_collections/${this.projectKey}/${this.draftDate}`,
            );
            const featureCollections = await response.json();

            for (let collection of featureCollections) {
                this.categoriesMetadata.push(collection.properties);

                for (let feature of collection.features) {
                    feature.properties["color"] =
                        collection.properties.category_color;
                }
            }

            this.setMapFeatures(featureCollections);

            document.getElementById(
                `${this.id}-loading-indicator`,
            ).style.display = "none";
        },
        setMapFeatures(featureCollections) {
            for (const index in this.featureLayers) {
                this.map.removeLayer(this.featureLayer[index]);
            }
            this.featureLayers = [];

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
            }

            this.resetActiveVectorExtent();
            this.fullExtent = createEmpty();

            this.fullExtent = extend(this.fullExtent, this.activeVectorExtent);
            this.fullExtent = extend(
                this.fullExtent,
                this.publicationTileLayers.getExtents().project,
            );

            this.map
                .getView()
                .fit(this.fullExtent, { padding: [10, 10, 10, 10] });
            this.map.setView(
                new View({
                    extent: this.map
                        .getView()
                        .calculateExtent(this.map.getSize()),
                    maxZoom: 40,
                }),
            );

            this.setupDone = true;
            this.resetFeatures();
        },

        resetActiveVectorExtent() {
            const vectorLayerFeatures = this.map
                .getAllLayers()
                .filter((layer) => layer instanceof VectorLayer)
                .map((layer) => layer.getSource().getFeatures())
                .flat();

            const uuid = this.docId;
            const linkedDocIds = this.linkedDocIds;

            const activeVectorExtent = createEmpty();
            vectorLayerFeatures.map(function (f) {
                properties = f.getProperties();

                if (
                    properties.uuid == uuid ||
                    linkedDocIds.includes(properties.uuid)
                ) {
                    extend(activeVectorExtent, f.getGeometry().getExtent());
                }
            });

            this.activeVectorExtent = activeVectorExtent;
        },

        resetFeatures() {
            if (!this.setupDone) return;

            if (!isEmpty(this.activeVectorExtent)) {
                this.map.getView().fit(this.activeVectorExtent, {
                    padding: [10, 10, 10, 10],
                });
            } else if (!isEmpty(this.fullExtent)) {
                this.map.getView().fit(this.fullExtent, {
                    padding: [10, 10, 10, 10],
                });
            } else {
                return;
            }

            const vectorLayerFeatures = this.map
                .getAllLayers()
                .filter((layer) => layer instanceof VectorLayer)
                .map((layer) => layer.getSource().getFeatures())
                .flat();

            const uuid = this.docId;
            const linkedDocIds = this.linkedDocIds;

            vectorLayerFeatures.map(function (f) {
                properties = f.getProperties();

                if (properties.uuid == uuid) {
                    properties.hidden = false;
                    properties.highlight = true;
                    properties.alpha = 0.5;
                } else if (linkedDocIds.includes(properties.uuid)) {
                    properties.hidden = false;
                    properties.highlight = false;
                    properties.alpha = getDefaultAlpha();
                } else {
                    properties.hidden = true;
                    properties.highlight = false;
                    properties.alpha = getDefaultAlpha();
                }

                f.setProperties(properties);
            });
        },
    };
};
