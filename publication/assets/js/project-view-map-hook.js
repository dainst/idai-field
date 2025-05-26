import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { createEmpty, extend } from 'ol/extent.js';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import GeoJSON from 'ol/format/GeoJSON.js';

import { createTileLayer, getVisibilityKey, styleFunction } from './map-helper-functions.js';

export default getProjectViewMapHook = () => {
    return {
        map: null,
        projectName: null,
        projectTileLayers: [],
        projectTileLayerExtent: null,
        featureLayers: [],

        mounted() {
            const _this = this;
            this.initialize();
            this.handleEvent(
                `project-map-set-layers-${this.el.id}`,
                ({ project, project_tile_layers }) => {
                    this.projectName = project;
                    this.setTileLayers(project, project_tile_layers)
                }
            )

            this.handleEvent(
                `project-map-update-${this.el.id}`,
                ({ feature_collections }) => {
                    this.setMapFeatures(feature_collections)
                }
            )


            this.handleEvent(
                `project-map-set-layer-visibility-${this.el.id}`,
                ({ uuid, visibility }) => {
                    this.toggleLayerVisibility(uuid, visibility)
                }
            )

            this.handleEvent(`map-highlight-feature-${this.el.id}`, ({ feature_id }) => {
                categoryNames = feature_id.split(",")

                this.clearHighlights();
                const vectorLayerFeatures = this.map.getAllLayers()
                    .filter(layer => layer instanceof VectorLayer)
                    .map(layer => layer.getSource().getFeatures())
                    .flat()

                vectorLayerFeatures.filter(function (f) {
                    return categoryNames.indexOf(f.getProperties().group) > -1
                }).map(function (f) {
                    _this.highlightFeature(f)
                })
            });


            this.handleEvent(`map-clear-highlights-${this.el.id}`, () => {
                this.clearHighlights();
            });
        },
        initialize() {

            document.getElementById(`${this.el.getAttribute("id")}-map`).innerHTML = ""

            this.map = new Map({
                target: `${this.el.getAttribute("id")}-map`,
                view: new View()
            });
        },

        setTileLayers(projectName, tileLayers) {
            let layerGroup = [];
            let layerGroupExtent = createEmpty();

            for (let info of tileLayers) {
                const layer = createTileLayer(info, projectName)

                layerGroup.push(layer);

                const preference = localStorage.getItem(getVisibilityKey(this.projectName, layer.get('name')))
                let visible = null;

                if (preference == "true") {
                    visible = true
                } else if (preference == "false") {
                    visible = false;
                }

                if (visible != null) {
                    layer.setVisible(visible)
                    this.pushEventTo(this.el, "visibility-preference", { uuid: layer.get('name'), group: "project", value: visible })
                }

                layerGroupExtent = extend(layerGroupExtent, layer.getExtent());
                this.map.addLayer(layer);
            }

            this.projectTileLayers = layerGroup;
            this.projectTileLayerExtent = layerGroupExtent;

            const layerCount = this.projectTileLayers.length

            for (let i = 0; i < layerCount; i++) {
                this.projectTileLayers[i].setZIndex(layerCount - i - 200);
            }
        },

        clearHighlights() {
            for (const index in this.featureLayers) {
                let features = this.featureLayers[index].getSource().getFeatures();

                for (let feature of features) {
                    let properties = feature.getProperties();
                    properties.fill = false;
                    feature.setProperties(properties);
                }
            }
        },

        highlightFeature(feature) {
            let properties = feature.getProperties()

            properties.fill = true;
            feature.setProperties(properties);
        },


        toggleLayerVisibility(uuid, visibility) {
            const layer = this.map.getLayers().getArray().find(layer => layer.get('name') == uuid)
            if (layer) {
                layer.setVisible(visibility);
                localStorage.setItem(getVisibilityKey(this.projectName, layer.get('name')), visibility)
            }
        },

        setMapFeatures(featureCollections) {

            for (const index in this.featureLayers) {
                delete this.featureLayers[index]
            }

            if (this.featureLayers != {}) this.map.removeLayer(this.featureLayer);

            let aggregatedExtent = createEmpty()

            for (collection of featureCollections) {

                const vectorSource = new VectorSource({
                    features: new GeoJSON().readFeatures(collection)
                });

                const featureLayer = new VectorLayer({
                    name: "featureLayer",
                    source: vectorSource,
                    style: styleFunction,
                });

                this.featureLayers.push(featureLayer)
                this.map.addLayer(featureLayer);

                extend(aggregatedExtent, vectorSource.getExtent());
            }

            let fullExtent = createEmpty();

            fullExtent = extend(fullExtent, aggregatedExtent);

            if (this.projectTileLayerExtent) fullExtent = extend(fullExtent, this.projectTileLayerExtent)

            this.map.getView().fit(fullExtent, { padding: [10, 10, 10, 10] });
            this.map.setView(new View({
                extent: this.map.getView().calculateExtent(this.map.getSize()),
                maxZoom: 40
            }));
            this.map.getView().fit(aggregatedExtent, { padding: [10, 10, 10, 10] });

            this.clearHighlights()
        }
    }
}