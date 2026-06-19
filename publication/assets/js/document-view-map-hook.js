import Map from "ol/Map.js";
import View from "ol/View.js";
import { createEmpty, extend, isEmpty } from "ol/extent.js";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON.js";
import Style from "ol/style/Style.js";
import { Fill, Stroke } from "ol/style.js";
import Draw from "ol/interaction/Draw.js";

import {
    styleFunction,
    setFillForLayer,
    clearAllHighlights,
    highlightFeature,
} from "./map/features";
import PublicationTileLayers from "./map/tile-layers";
import PreviewOverlay from "./map/preview-overlay.js";
import PublicationSelection from "./map/selection";

export default getDocumentViewMapHook = () => {
    return {
        map: null,
        projectKey: null,
        projectDraftDate: null,
        publicationTileLayers: null,
        docId: null,
        parentLayer: null,
        ancestorLayer: null,
        docLayer: null,
        childrenLayer: null,
        hoveredFeatures: [],
        pinnedFeatures: [],
        selectionMode: false,
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
                ({
                    document_uuid,
                    document_feature_info,
                    children_features,
                    parent_features,
                    ancestor_features,
                }) => {
                    this.docId = document_uuid;
                    this.setMapFeatures(
                        document_feature_info.category_labels
                            ? document_feature_info.category_labels
                            : null,
                        document_feature_info.feature
                            ? document_feature_info.feature
                            : null,
                        parent_features,
                        children_features,
                        ancestor_features,
                    );
                },
            );

            this.handleEvent(
                `map-highlight-feature-${this.el.id}`,
                ({ feature_id }) => {
                    clearAllHighlights([
                        this.ancestorLayer,
                        this.parentLayer,
                        this.docLayer,
                        this.childrenLayer,
                    ]);
                    const vectorLayerFeatures = this.map
                        .getAllLayers()
                        .filter((layer) => layer instanceof VectorLayer)
                        .map((layer) => layer.getSource().getFeatures())
                        .flat();

                    const feature = vectorLayerFeatures.find(function (f) {
                        return f.getProperties().uuid == feature_id;
                    });

                    if (feature) highlightFeature(feature);
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
                clearAllHighlights([
                    this.ancestorLayer,
                    this.parentLayer,
                    this.docLayer,
                    this.childrenLayer,
                ]);

                setFillForLayer(this.docLayer, true);
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

        initialize() {
            const _this = this;

            this.projectKey = this.el.getAttribute("project_key");
            this.projectDraftDate = this.el.getAttribute("draft_date");
            this.language = this.el.getAttribute("language");

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
                this.projectDraftDate,
            );

            this.publicationTileLayers = new PublicationTileLayers(
                this,
                this.map,
                this.projectKey,
                this.draftDate,
            );

            this.selection = new PublicationSelection(this, this.map, () => {
                this.selectionMode = false;
            });

            this.el.addEventListener("pointerenter", function (e) {
                setFillForLayer(_this.docLayer, false);
            });

            this.el.addEventListener("pointerleave", function (e) {
                [
                    //_this.ancestorLayer,
                    _this.parentLayer,
                    _this.childrenLayer,
                ].map((layer) => {
                    setFillForLayer(layer, false);
                });

                setFillForLayer(_this.docLayer, true);
                _this.overlay.hide();
            });

            this.map.on("pointermove", async function (e) {
                if (
                    e.dragging ||
                    _this.selectionMode ||
                    _this.pinnedFeatures.length != 0
                ) {
                    return;
                }

                [
                    // _this.ancestorLayer,
                    _this.parentLayer,
                    _this.childrenLayer,
                ].map((layer) => {
                    setFillForLayer(layer, false);
                });

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
                        _this.categoryLabels,
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
                        _this.categoryLabels,
                        e.coordinate,
                        _this.language,
                        true,
                    );
                } else if (_this.hoveredFeatures.length === 1) {
                    const properties = _this.hoveredFeatures[0].getProperties();
                    _this
                        .js()
                        .patch(
                            `/projects/${_this.projectKey}/${_this.projectDraftDate}/${properties.uuid}`,
                        );
                    _this.overlay.hide();
                }
            });
        },
        async setMapFeatures(
            documentCategoryLabels,
            documentFeature,
            parentCollection,
            childCollection,
            ancestorFeatures,
        ) {
            if (this.childrenLayer) this.map.removeLayer(this.childrenLayer);
            if (this.docLayer) this.map.removeLayer(this.docLayer);
            if (this.parentLayer) this.map.removeLayer(this.parentLayer);
            if (this.ancestorLayer) this.map.removeLayer(this.ancestorLayer);

            this.categoryLabels = {};

            let documentVectorSource = null;
            if (documentFeature) {
                this.categoryLabels[documentFeature.properties.category] =
                    documentCategoryLabels;

                documentFeature.properties.fill = true;

                documentVectorSource = new VectorSource({
                    features: new GeoJSON().readFeatures(documentFeature),
                });

                this.docLayer = new VectorLayer({
                    source: documentVectorSource,
                    style: styleFunction,
                    properties: {
                        mainDocumentLayer: true,
                    },
                });
                this.map.addLayer(this.docLayer);
            }

            for (categoryKey in parentCollection.properties.category_labels) {
                this.categoryLabels[categoryKey] =
                    parentCollection.properties.category_labels[categoryKey];
            }

            const parentVectorSource = new VectorSource({
                features: new GeoJSON().readFeatures(parentCollection),
            });

            this.parentLayer = new VectorLayer({
                name: "parentLayer",
                source: parentVectorSource,
                style: styleFunction,
            });

            this.map.addLayer(this.parentLayer);

            for (categoryKey in childCollection.properties.category_labels) {
                this.categoryLabels[categoryKey] =
                    childCollection.properties.category_labels[categoryKey];
            }

            const childrenVectorSource = new VectorSource({
                features: new GeoJSON().readFeatures(childCollection),
            });

            this.childrenLayer = new VectorLayer({
                name: "childrenLayer",
                source: childrenVectorSource,
                style: styleFunction,
            });

            this.map.addLayer(this.childrenLayer);

            aggregatedExtent = createEmpty();
            aggregatedExtent = extend(
                aggregatedExtent,
                parentVectorSource.getExtent(),
            );

            if (documentFeature) {
                aggregatedExtent = extend(
                    aggregatedExtent,
                    documentVectorSource.getExtent(),
                );
            }

            aggregatedExtent = extend(
                aggregatedExtent,
                childrenVectorSource.getExtent(),
            );

            let fullExtent = createEmpty();

            fullExtent = extend(fullExtent, aggregatedExtent);
            fullExtent = extend(
                fullExtent,
                this.publicationTileLayers.getExtents().project,
            );

            fullExtent = extend(
                fullExtent,
                this.publicationTileLayers.getExtents().document,
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

            if (!isEmpty(aggregatedExtent)) {
                this.map
                    .getView()
                    .fit(aggregatedExtent, { padding: [10, 10, 10, 10] });
            }

            clearAllHighlights([
                this.ancestorLayer,
                this.parentLayer,
                this.docLayer,
                this.childrenLayer,
            ]);
            setFillForLayer(this.docLayer, true);
        },
    };
};
