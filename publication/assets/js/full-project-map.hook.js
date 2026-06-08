import Map from "ol/Map.js";
import View from "ol/View.js";
import { createEmpty, extend } from "ol/extent.js";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON.js";

import {
    createTileLayer,
    getVisibilityKey,
    styleFunction,
} from "./map-helper-functions.js";

const highlightZoomDuration = 800;

export default getFullProjectMapHook = () => {
    return {
        map: null,
        projectName: null,
        projectTileLayers: [],
        projectTileLayerExtent: null,
        featureLayers: [],
        fullVectorExtent: null,
        lastHighlightChange: Date.now(),

        mounted() {
            const _this = this;
            this.initialize();
            this.handleEvent(
                `full-project-map-set-layers-${this.el.id}`,
                ({ project, project_tile_layers }) => {
                    this.projectName = project;
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
                `map-highlight-feature-${this.el.id}`,
                ({ feature_id }) => {
                    if (
                        Date.now() - this.lastHighlightChange >
                        highlightZoomDuration
                    ) {
                        this.clearHighlights();
                        feature = this.findFeature(feature_id);
                        parentId = feature.getProperties().parent;

                        if (parentId) {
                            parent = this.findFeature(parentId);
                            if (parent) {
                                this.map
                                    .getView()
                                    .fit(parent.getGeometry().getExtent(), {
                                        padding: [10, 10, 10, 10],
                                        duration: highlightZoomDuration,
                                    });
                            } else if (
                                feature.getProperties().type != "Point"
                            ) {
                                this.map
                                    .getView()
                                    .fit(feature.getGeometry().getExtent(), {
                                        padding: [10, 10, 10, 10],
                                        duration: highlightZoomDuration,
                                    });
                            } else {
                                console.log(
                                    `No geometry or parent geometry to zoom to for ${feature_id}`,
                                );
                            }
                        } else {
                            this.map
                                .getView()
                                .fit(feature.getGeometry().getExtent(), {
                                    padding: [10, 10, 10, 10],
                                    duration: highlightZoomDuration,
                                });
                        }

                        this.highlightFeature(feature);
                        this.lastHighlightChange = Date.now();
                    }
                },
            );

            this.handleEvent(`map-clear-highlights-${this.el.id}`, () => {
                this.clearHighlights();
                this.map.getView().fit(this.fullVectorExtent, {
                    padding: [10, 10, 10, 10],
                    duration: highlightZoomDuration,
                });

                this.lastHighlightChange = Date.now();
            });
        },
        initialize() {
            const container = document.getElementById(
                `${this.el.getAttribute("id")}-map`,
            );

            const offsetElement = document.getElementById(`map-offset-element`);
            container.innerHTML = "";
            container.style.height = `${window.innerHeight - offsetElement.offsetTop}px`;

            this.map = new Map({
                target: `${this.el.getAttribute("id")}-map`,
                view: new View(),
            });
        },

        setTileLayers(projectName, tileLayers) {
            let layerGroup = [];
            let layerGroupExtent = createEmpty();

            for (let info of tileLayers) {
                const layer = createTileLayer(info, projectName);

                layerGroup.push(layer);

                const preference = localStorage.getItem(
                    getVisibilityKey(this.projectName, layer.get("name")),
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
                    getVisibilityKey(this.projectName, layer.get("name")),
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

        setMapFeatures(featureCollections) {
            for (const index in this.featureLayers) {
                delete this.featureLayers[index];
            }

            if (this.featureLayers != {})
                this.map.removeLayer(this.featureLayer);

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
            this.map
                .getView()
                .fit(this.fullVectorExtent, { padding: [10, 10, 10, 10] });
            this.clearHighlights();
        },
    };
};
