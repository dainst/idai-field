import Map from "ol/Map.js";
import View from "ol/View.js";
import { createEmpty, extend } from "ol/extent.js";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { asArray } from "ol/color";
import GeoJSON from "ol/format/GeoJSON.js";
import Overlay from "ol/Overlay.js";
import Draw from "ol/interaction/Draw.js";
import { Fill, Stroke } from "ol/style.js";
import Style from "ol/style/Style.js";

import {
    createTileLayer,
    getVisibilityKey,
    styleFunction,
} from "./map-helper-functions.js";

const highlightZoomDuration = -1;

function pickTranslation(options, selected) {
    if (options[selected]) return options[selected];
    if (options["en"]) return options["en"];

    return options[Object.keys(options)[0]];
}

function renderPreviewList(features, hook, addButton = false) {
    const container = document.createElement("div");

    container.classList.add("flex", "gap-0.5");

    const list = document.createElement("div");
    list.classList.add("flex", "flex-col", "gap-0.5");

    if (features.length == 0) {
        return list;
    }

    for (let feature of features) {
        list.appendChild(renderPreviewIcon(feature, hook, addButton));
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
                new CustomEvent(`phx:close-preview-list-${hook.id}`),
            );
        };
        container.appendChild(closeButton);
    }
    return container;
}

function renderPreviewIcon(feature, hook) {
    let properties = feature.getProperties();

    preview = document.createElement("div");
    preview.classList.add("border", "border-black", "flex");

    categoryLabel = document.createElement("div");
    categoryLabel.classList.add("h-full", "bg-white/60", "p-1", "font-thin");

    categoryLabel.appendChild(
        document.createTextNode(
            `${pickTranslation(hook.categoryLabels[properties.category], hook.language)}`,
        ),
    );

    categoryInfo = document.createElement("div");
    categoryInfo.classList.add("pl-2", "text-black");
    categoryInfo.style = `background: hsl(from ${properties.color} h calc(s * 0.5) l)`;

    categoryInfo.appendChild(categoryLabel);

    documentInfo = document.createElement("div");
    documentInfo.classList.add(
        "document-info",
        "grow",
        "p-1",
        "h-full",
        "bg-white",
        "cursor-pointer",
    );

    // if (!addButton) documentInfo.classList.add("rounded-r-sm");
    documentInfoText = properties.identifier;

    if (properties.description) {
        documentInfoText += ` | ${pickTranslation(properties.description, hook.language)}`;
    }

    documentInfo.appendChild(document.createTextNode(documentInfoText));

    documentInfo.addEventListener("click", function (event) {
        return hook
            .js()
            .navigate(
                `/projects/${hook.projectKey}/${hook.draftDate}/${properties.uuid}`,
            );
    });

    preview.appendChild(categoryInfo);
    preview.appendChild(documentInfo);

    return preview;
}

async function checkForHitInOrder(layers, coords) {
    let hits = [];
    for (const layer of layers) {
        const features = await layer.getFeatures(coords);

        if (features.length) {
            hits = hits.concat(features);
        }
    }

    return hits;
}

export default getFullProjectMapHook = () => {
    return {
        id: null,
        map: null,
        projectKey: null,
        draftDate: null,
        projectTileLayers: [],
        projectTileLayerExtent: null,
        featureLayers: [],
        fullVectorExtent: null,
        lastHighlightChange: Date.now(),
        hoveredFeatures: [],
        pinnedFeatures: [],
        identifierOverlay: null,
        categoryLabels: {},
        drawBoxMode: false,
        draw: null,
        drawSource: null,
        drawLayer: null,

        mounted() {
            const _this = this;
            this.initialize();
            this.handleEvent(
                `full-project-map-set-layers-${this.el.id}`,
                ({ project, project_tile_layers }) => {
                    this.projectKey = project;
                    this.setTileLayers(project, project_tile_layers);
                },
            );

            this.handleEvent(
                `full-project-map-data-${this.el.id}`,
                ({ feature_collections }) => {
                    this.setMapFeatures(feature_collections);
                },
            );

            this.handleEvent(
                `full-project-map-set-layer-visibility-${this.el.id}`,
                ({ uuid, visibility }) => {
                    this.toggleLayerVisibility(uuid, visibility);
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
                    this.updateFeatureOverlay(this.pinnedFeatures);
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

                        this.updateFeatureOverlay([]);

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

            const _this = this;
            const container = document.getElementById(`${this.id}-map`);

            if (this.el.getAttribute("offset_base_element")) {
                const offsetElement = document.getElementById(
                    this.el.getAttribute("offset_base_element"),
                );
                //container.innerHTML = "";
                container.style.height = `${window.innerHeight - offsetElement.offsetTop}px`;
            }

            const overlayDiv = document.getElementById(
                `${this.el.getAttribute("id")}-identifier-tooltip`,
            );

            this.identifierOverlay = new Overlay({
                element: overlayDiv,
                offset: [5, 5],
                stopEvent: false,
            });

            this.identifierOverlay.setPosition(undefined);

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
            });

            this.map = new Map({
                layers: [this.drawLayer],
                target: `${this.id}-map`,
                view: new View(),
                overlays: [this.identifierOverlay],
            });

            this.map.on("pointermove", async function (e) {
                if (e.dragging || _this.drawBoxMode) {
                    return;
                }

                if (_this.pinnedFeatures.length == 0) {
                    _this.hoveredFeatures = await checkForHitInOrder(
                        _this.featureLayers,
                        e.pixel,
                    );
                    _this.updateFeatureOverlay(
                        _this.hoveredFeatures,
                        e.coordinate,
                    );
                }
            });

            this.map.addEventListener("pointerleave", function (e) {
                if (_this.drawBoxMode) return;

                _this.featureLayers.map((layer) => {
                    setFillForLayer(layer, false);
                });
            });

            this.map.on("singleclick", async function (e) {
                if (_this.drawBoxMode) return;

                if (_this.hoveredFeatures.length != 0) {
                    _this.pinnedFeatures = _this.hoveredFeatures;
                    _this.hoveredFeatures = [];
                    _this.updateFeatureOverlay(
                        _this.pinnedFeatures,
                        e.coordinate,
                        true,
                    );
                }
            });

            this.projectKey = this.el.getAttribute("project_key");
            this.draftDate = this.el.getAttribute("draft_date");

            const response = await fetch(
                `/api/json/geometry_feature_collections/${this.projectKey}/${this.draftDate}`,
            );
            const { category_labels, feature_collections } =
                await response.json();

            this.categoryLabels = category_labels;
            this.language = this.el.getAttribute("language");

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

        updateFeatureOverlay(features, coordinate, addButton = false) {
            this.clearHighlights();

            let tooltipContentNode = document.getElementById(
                `${this.el.getAttribute("id")}-identifier-tooltip-content`,
            );

            while (tooltipContentNode.firstChild) {
                tooltipContentNode.removeChild(tooltipContentNode.firstChild);
            }

            if (features.length > 0) {
                tooltipContentNode.appendChild(
                    renderPreviewList(features, this, addButton),
                );

                const anchorPixel = this.map.getPixelFromCoordinate(coordinate);
                const mapSize = this.map.getSize();

                const right =
                    anchorPixel[0] > mapSize[0] * 0.5 ? "right" : "left";
                const bottom =
                    anchorPixel[1] > mapSize[1] * 0.5 ? "bottom" : "top";

                const offsetX = right == "right" ? -5 : 5;
                const offsetY = bottom == "bottom" ? -5 : 5;

                this.identifierOverlay.setPositioning(`${bottom}-${right}`);
                this.identifierOverlay.setOffset([offsetX, offsetY]);
                this.identifierOverlay.setPosition(coordinate);
            }
        },

        setTileLayers(projectKey, tileLayers) {
            let layerGroup = [];
            let layerGroupExtent = createEmpty();

            for (let info of tileLayers) {
                const layer = createTileLayer(info, projectKey);

                layerGroup.push(layer);

                const preference = localStorage.getItem(
                    getVisibilityKey(this.projectKey, layer.get("name")),
                );
                let visible = null;

                if (preference == "true") {
                    visible = true;
                } else if (preference == "false") {
                    visible = false;
                }

                if (visible != null) {
                    layer.setVisible(visible);
                    this.pushEventTo(this.el, "visibility-preference", {
                        uuid: layer.get("name"),
                        group: "project",
                        value: visible,
                    });
                }

                layerGroupExtent = extend(layerGroupExtent, layer.getExtent());
                this.map.addLayer(layer);
            }

            this.projectTileLayers = layerGroup;
            this.projectTileLayerExtent = layerGroupExtent;

            const layerCount = this.projectTileLayers.length;

            for (let i = 0; i < layerCount; i++) {
                this.projectTileLayers[i].setZIndex(layerCount - i - 200);
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

        toggleLayerVisibility(uuid, visibility) {
            const layer = this.map
                .getLayers()
                .getArray()
                .find((layer) => layer.get("name") == uuid);
            if (layer) {
                layer.setVisible(visibility);
                localStorage.setItem(
                    getVisibilityKey(this.projectKey, layer.get("name")),
                    visibility,
                );
            }
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

            if (this.projectTileLayerExtent)
                fullExtent = extend(fullExtent, this.projectTileLayerExtent);

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
