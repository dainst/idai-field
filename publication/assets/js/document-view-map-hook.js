
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { createEmpty, extend } from 'ol/extent.js';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import GeoJSON from 'ol/format/GeoJSON.js';
import { asArray } from 'ol/color';
import Overlay from 'ol/Overlay.js';

import { createTileLayer, getVisibilityKey, styleFunction } from './map-helper-functions.js';

async function checkForHitInOrder(layers, coords) {
    for (const layer of layers) {
        const features = await layer.getFeatures(coords);

        if (features.length) {
            return features;
        }
    }

    return [];
}

function setFillForLayer(layer, value) {
    if (!layer) return;

    let features = layer.getSource().getFeatures();
    for (let feature of features) {
        let properties = feature.getProperties();
        properties.fill = value;
        feature.setProperties(properties);
    }
}


export default getDocumentViewMapHook = () => {
    return {
        map: null,
        projectName: null,
        docId: null,
        projectTileLayers: [],
        projectTileLayerExtent: null,
        documentTileLayers: [],
        documentTileLayerExtent: null,
        parentLayer: null,
        ancestorLayer: null,
        docLayer: null,
        childrenLayer: null,
        identifierOverlay: null,
        identifierOverlayContent: null,

        mounted() {
            this.initialize();
            this.handleEvent(
                `document-map-set-project-layers-${this.el.id}`,
                ({ project, project_tile_layers }) => {
                    this.setTileLayers(project, project_tile_layers, "project")
                }
            )
            this.handleEvent(
                `document-map-set-document-layers-${this.el.id}`,
                ({ project, document_tile_layers }) => {
                    this.setTileLayers(project, document_tile_layers, "document")
                }
            )
            this.handleEvent(
                `document-map-update-${this.el.id}`,
                ({ project, document_feature, children_features, parent_features, ancestor_features }) => {
                    this.projectName = project
                    this.setMapFeatures(parent_features, document_feature, children_features, ancestor_features)
                }
            )
            this.handleEvent(
                `document-map-set-layer-visibility-${this.el.id}`,
                ({ uuid, visibility }) => {
                    this.toggleLayerVisibility(uuid, visibility)
                }
            )

            this.handleEvent(`map-highlight-feature-${this.el.id}`, ({ feature_id }) => {
                this.clearAllHighlights();
                const vectorLayerFeatures = this.map.getAllLayers().filter(layer => layer instanceof VectorLayer).map(layer => layer.getSource().getFeatures()).flat()

                const feature = vectorLayerFeatures.find(function (f) {
                    return f.getProperties().uuid == feature_id
                })

                if (feature) this.highlightFeature(feature, null)
            })

            this.handleEvent(`map-clear-highlights-${this.el.id}`, () => {
                this.clearAllHighlights();

                setFillForLayer(this.docLayer, true)
            })
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
                setFillForLayer(_this.docLayer, false);
            });

            this.el.addEventListener('pointerleave', function (e) {
                [
                    _this.ancestorLayer,
                    _this.parentLayer,
                    _this.childrenLayer
                ].map(layer => {
                    setFillForLayer(layer, false);
                })

                setFillForLayer(_this.docLayer, true)
                _this.identifierOverlay.setPosition(undefined)
            });

            this.map.on('pointermove', async function (e) {

                if (e.dragging) {
                    return;
                }

                [
                    _this.ancestorLayer,
                    _this.parentLayer,
                    _this.childrenLayer
                ].map(layer => {
                    setFillForLayer(layer, false);
                })

                _this.identifierOverlay.setPosition(undefined)

                const hitFeatures = await checkForHitInOrder(
                    [_this.childrenLayer, _this.parentLayer, _this.ancestorLayer],
                    e.pixel
                )
                if (hitFeatures.length > 0) {
                    _this.highlightFeature(hitFeatures[0], e.coordinate)
                }
            });

            this.map.on('singleclick', async function (e) {
                const hitFeatures = await checkForHitInOrder(
                    [_this.childrenLayer, _this.parentLayer, _this.ancestorLayer],
                    e.pixel
                )

                if (hitFeatures.length > 0) {
                    let properties = hitFeatures[0].getProperties()
                    _this.pushEvent("geometry-clicked", { uuid: properties.uuid })
                };
            })
        },
        setTileLayers(projectName, tileLayersInfo, groupName) {
            let layerGroup = [];
            let layerGroupExtent = createEmpty();

            for (let info of tileLayersInfo) {
                const layer = createTileLayer(info, projectName)

                layerGroup.push(layer);

                const preference = localStorage.getItem(getVisibilityKey(this.project, layer.get('name')))
                let visible = null;

                if (preference == "true") {
                    visible = true
                } else if (preference == "false") {
                    visible = false;
                }

                if (visible != null) {
                    layer.setVisible(visible)
                    this.pushEventTo(this.el, "visibility-preference", { uuid: layer.get('name'), group: groupName, value: visible })
                }

                layerGroupExtent = extend(layerGroupExtent, layer.getExtent());
                this.map.addLayer(layer);
            }

            if (groupName == "project") {
                this.projectTileLayers = layerGroup;
                this.projectTileLayerExtent = layerGroupExtent;
            } else if (groupName == "document") {
                this.documentTileLayers = layerGroup;
                this.documentTileLayerExtent = layerGroupExtent;
            }

            this.updateZIndices();
        },

        updateZIndices() {
            const layerCount = 0 + this.documentTileLayers.length + this.projectTileLayers.length
            const combined = this.documentTileLayers.concat(this.projectTileLayers);

            for (let i = 0; i < layerCount; i++) {
                combined[i].setZIndex(layerCount - i - 200);
            }
        },

        async setMapFeatures(parentFeatures, documentFeature, childrenFeatures, ancestorFeatures) {
            this.docId = documentFeature.properties.uuid;

            if (this.childrenLayer) this.map.removeLayer(this.childrenLayer);
            if (this.docLayer) this.map.removeLayer(this.docLayer);
            if (this.parentLayer) this.map.removeLayer(this.parentLayer);
            if (this.ancestorLayer) this.map.removeLayer(this.ancestorLayer);

            const ancestorVectorSoruce = new VectorSource({
                features: new GeoJSON().readFeatures(ancestorFeatures)
            });

            this.ancestorLayer = new VectorLayer({
                name: "ancestorLayer",
                source: ancestorVectorSoruce,
                style: styleFunction,
            });

            this.map.addLayer(this.ancestorLayer);

            const parentVectorSource = new VectorSource({
                features: new GeoJSON().readFeatures(parentFeatures)
            });

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

            aggregatedExtent = createEmpty()
            aggregatedExtent = extend(aggregatedExtent, parentVectorSource.getExtent())
            aggregatedExtent = extend(aggregatedExtent, vectorSource.getExtent())
            aggregatedExtent = extend(aggregatedExtent, childrenVectorSource.getExtent())

            let fullExtent = createEmpty();

            fullExtent = extend(fullExtent, aggregatedExtent);

            if (this.projectTileLayerExtent) fullExtent = extend(fullExtent, this.projectTileLayerExtent)
            if (this.documentTileLayerExtent) fullExtent = extend(fullExtent, this.documentTileLayerExtent)

            this.map.getView().fit(fullExtent, { padding: [10, 10, 10, 10] });
            this.map.setView(new View({
                extent: this.map.getView().calculateExtent(this.map.getSize()),
                maxZoom: 40
            }));
            this.map.getView().fit(aggregatedExtent, { padding: [10, 10, 10, 10] });

            this.clearAllHighlights()
        },
        highlightFeature(feature, coordinate) {
            let properties = feature.getProperties()

            properties.fill = true;
            feature.setProperties(properties);

            if (coordinate) {
                this.identifierOverlayContent.innerHTML = `${properties.identifier} | ${properties.description}`;

                const [r, g, b, a] = asArray(properties.color)
                document.getElementById(`${this.el.getAttribute("id")}-identifier-tooltip-category-bar`).style.background = `rgba(${r}, ${g}, ${b})`
                document.getElementById(`${this.el.getAttribute("id")}-identifier-tooltip-category-content`).innerHTML = properties.category;

                this.identifierOverlay.setPosition(coordinate);
            }
        },
        clearAllHighlights() {
            [
                this.ancestorLayer,
                this.parentLayer,
                this.docLayer,
                this.childrenLayer
            ].map(layer => {
                setFillForLayer(layer, false)
            })

            this.identifierOverlay.setPosition(undefined)
        },
        toggleLayerVisibility(uuid, visibility) {
            const layer = this.map.getLayers().getArray().find(layer => layer.get('name') == uuid)
            if (layer) {
                layer.setVisible(visibility);
                localStorage.setItem(this.getVisibilityKey(this.projectName, layer.get('name')), visibility)
            }
        }
    }
}