import Map from "ol/Map.js";
import View from "ol/View.js";
import { createEmpty, extend } from "ol/extent.js";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON.js";

import proj4 from "proj4";

import {
    findFeature,
    findFeaturesAtPixel,
    highlightFeature,
    clearAllHighlights,
    styleFunction,
    loadFeatureCollection,
    extentIsPoint,
} from "./map/features";
import PublicationTileLayers from "./map/tile-layers";
import PreviewOverlay from "./map/preview-overlay";
import PublicationSelection from "./map/selection";
const highlightZoomDuration = -1;

export default (getPublicationMapHook = () => {
    return {
        id: null,
        map: null,
        projectKey: null,
        draftDate: null,
        publicationTileLayers: null,
        featureLayers: [],
        fullVectorExtent: null,
        lastHighlightChange: Date.now(),
        categoriesMetadata: [],
        selectionMode: false,
        overlay: null,
        lastInteractionBlock: Date.now(),
        interactionTimeout: 500,
        mounted() {
            this.initialize();

            this.handleEvent(
                `map-highlight-feature-${this.el.id}`,
                ({ feature_id }) => {
                    if (this.map) {
                        clearAllHighlights(this.featureLayers);
                        if (feature_id.startsWith("categories-")) {
                            this.highlightCategories(feature_id);
                        } else {
                            this.highlightDocument(feature_id);
                        }
                    }
                },
            );

            this.handleEvent(`map-clear-highlights-${this.el.id}`, () => {
                if (this.map) {
                    clearAllHighlights(this.featureLayers);

                    if (this.selection.getExtent()) {
                        this.refitView();
                    }
                }
            });

            this.handleEvent(
                `set-selection-polygon-${this.el.id}`,
                ({ geometry }) => {
                    if (geometry) {
                        this.selection.presetSelection(
                            this.reprojectSelectionPolygon(geometry, false),
                        );
                    } else {
                        this.selection.presetSelection(null);
                    }
                },
            );

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
            this.projectKey = this.el.getAttribute("project_identifier");
            this.draftDate = this.el.getAttribute("draft_date");
            this.language = this.el.getAttribute("language");
            this.projectionName = this.el.getAttribute("projection_name");
            this.projection = this.el.getAttribute("projection");

            if (this.projectionName && this.projection) {
                proj4.defs(
                    this.projectionName,
                    this.projection,
                );
            }

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

            this.publicationTileLayers = new PublicationTileLayers(
                this,
                this.map,
                this.projectKey,
                this.draftDate,
            );

            this.selection = new PublicationSelection(
                this.map,
                (resultPolygon) => {
                    if (resultPolygon) {
                        this.pushEventTo(this.el, "drawn-selection", {
                            coordinates: this.reprojectSelectionPolygon(
                                resultPolygon,
                                true,
                            ),
                        });
                    }
                    this.lastInteractionBlock = Date.now();
                    this.selectionMode = false;
                },
            );

            const featureCollection = await loadFeatureCollection(
                this.projectKey,
                this.draftDate,
            );

            this.setMapFeatures(featureCollection);

            this.map.on("pointermove", async function (e) {
                if (e.dragging || _this.selectionMode) {
                    return;
                }

                const features = findFeaturesAtPixel(e.pixel, _this.map);

                clearAllHighlights(_this.featureLayers);
                for (let feature of features) {
                    highlightFeature(feature);
                }

                _this.overlay.mapHover(e, features);
            });

            this.map.on("singleclick", async function (e) {
                if (_this.selectionMode || _this.isInteractionOnTimeout())
                    return;

                _this.overlay.mapClicked(e);
            });

            this.overlay = new PreviewOverlay(
                this,
                this.map,
                overlayDiv,
                this.projectKey,
                this.draftDate,
                this.language,
            );

            document.getElementById(
                `${this.id}-loading-indicator`,
            ).style.display = "none";
        },

        isInteractionOnTimeout() {
            return (
                Date.now() - this.lastInteractionBlock < this.interactionTimeout
            );
        },

        highlightCategories(categories) {
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
            if (this.map) {
                feature = findFeature(uuid, this.map);
                featureExtent = feature.getGeometry().getExtent()
                parentId = feature.getProperties().parent;

                if (this.selection.getExtent()) {
                    this.map.getView().fit(this.selection.getExtent(), {
                        padding: [10, 10, 10, 10],
                        duration: highlightZoomDuration,
                    });
                } else if (parentId) {
                    parent = findFeature(parentId, this.map);
                    if (parent) {
                        let combinedExtent = createEmpty();

                        combinedExtent = extend(
                            combinedExtent,
                            parent.getGeometry().getExtent(),
                        );
                        combinedExtent = extend(
                            combinedExtent,
                            featureExtent,
                        );

                        this.map.getView().fit(combinedExtent, {
                            padding: [10, 10, 10, 10],
                            duration: highlightZoomDuration,
                        });
                    } else {
                        console.log(
                            `No geometry or parent geometry to zoom to for ${uuid}`,
                        );
                    }
                } else if (feature.getProperties().type != "Point") {
                    this.map
                        .getView()
                        .fit(featureExtent, {
                            padding: [10, 10, 10, 10],
                            duration: highlightZoomDuration,
                        });
                }
                highlightFeature(feature);
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

        setMapFeatures(featureCollection) {
            for (const index in this.featureLayers) {
                this.map.removeLayer(this.featureLayer[index]);
            }
            this.featureLayers = [];

            const vectorSource = new VectorSource({
                features: new GeoJSON().readFeatures(featureCollection),
            });

            const featureLayer = new VectorLayer({
                name: "Vector Features",
                source: vectorSource,
                style: styleFunction,
            });

            this.featureLayers.push(featureLayer);
            this.map.addLayer(featureLayer);

            this.fullVectorExtent = vectorSource.getExtent();

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

        reprojectSelectionPolygon(geometry, to4326) {
            const reprojected = [];

            const input = to4326 ? this.projectionName : "EPSG:4326";
            const output = to4326 ? "EPSG:4326" : this.projectionName;

            for (var i = 0; i < geometry.length; i++) {
                reprojected.push(proj4(input, output, geometry[i]));
            }

            return reprojected;
        },
    };
});
