import { Feature, FeatureCollection } from 'geojson';
import { Feature as OlFeature, MapBrowserEvent } from 'ol';
import olms from 'ol-mapbox-style';
import { Attribution, defaults as defaultControls } from 'ol/control';
import { boundingExtent } from 'ol/extent';
import GeoJSON from 'ol/format/GeoJSON';
import { Geometry } from 'ol/geom';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import Map from 'ol/Map';
import { Cluster, Vector as VectorSource } from 'ol/source';
import OSM from 'ol/source/OSM';
import { Fill, Icon, Stroke, Style, Text } from 'ol/style';
import View from 'ol/View';
import React, { CSSProperties, ReactElement, useEffect, useState } from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { FilterBucket, ResultDocument, ResultFilter } from '../../api/result';
import { NAVBAR_HEIGHT, SIDEBAR_WIDTH } from '../../constants';
import { useSearchParams } from '../../shared/location';
import { getProjectLabel } from '../projects';
import './overview-map.css';


const DEFAULT_MAPBOX_STYLE_ID = 'sebastiancuy/ckff2undp0v1o19mhucq9oycb';

const FIT_OPTIONS = {
    padding: [ 200, 200, 200, 200 ],
    searchPadding: [ 200, 200, 200, SIDEBAR_WIDTH + 200 ],
    duration: 500
};

const CLUSTER_DISTANCE = 120;


export default function OverviewMap({ documents, filter, withSearchResults }
        : { documents: ResultDocument[], filter?: ResultFilter, withSearchResults: boolean }): ReactElement {

    const [map, setMap] = useState<Map>(null);
    const searchParams = useSearchParams();
    const { t } = useTranslation();

    useEffect(() => {

        const newMap = createMap();
        setMap(newMap);

        return () => {
            newMap ?? newMap.setTarget(null);
        };
    }, []);

    useEffect(() => {

        if (!map) return;

        const featureCollection = createFeatureCollection(documents, filter);

        const vectorLayer = getGeoJSONLayer(featureCollection, t);
        map.addLayer(vectorLayer);

        if (!featureCollection) return;

        map.getView().fit(((vectorLayer.getSource() as Cluster).getSource() as VectorSource<Geometry>).getExtent(),
            { padding: withSearchResults ? FIT_OPTIONS.searchPadding : FIT_OPTIONS.padding });

        const documentsWithCoordinates = documents.filter(document => document.resource.geometry_wgs84);
        if (documentsWithCoordinates.length === 1) map.getView().setZoom(2);

        const onPointerMove = (e: MapBrowserEvent) => {
            const pixel = map.getEventPixel(e.originalEvent);
            const hit = map.hasFeatureAtPixel(pixel,
                { layerFilter: (layer) => layer === vectorLayer }
            );
            map.getViewport().style.cursor = hit ? 'pointer' : '';
        };
        map.on('pointermove', onPointerMove);

        return () => {
            map.removeLayer(vectorLayer);
            map.un('pointermove', onPointerMove);
        };
    }, [map, documents, filter, withSearchResults, t]);

    useEffect(() => {

        if (!map) return;

        const onClick = (e: MapBrowserEvent) => {
            e.preventDefault();
            map.forEachFeatureAtPixel(e.pixel, clusterFeature => {
                const features = clusterFeature.get('features');
                if (!features) return;

                if (features.length === 1) {
                    const feature = features[0];

                    if (feature.getProperties().identifier) {
                        // this causes openlayers to throw an error, presumably because
                        // the map element does not exist when some event listener fires
                        // history.push(`/project/${feature.getProperties().identifier}`);
    
                        // so instead reload the application when selecting a project
                        let href = `/project/${feature.getProperties().identifier}`;
                        if (searchParams.toString()) href += `/search/?${searchParams}`;
                        window.location.href = href;
                    }
                } else {
                    const extent = boundingExtent(
                        features.map(feature => feature.getGeometry().getCoordinates())
                    );
                    map.getView().fit(
                        extent,
                        {
                            duration: FIT_OPTIONS.duration,
                            padding: withSearchResults ? FIT_OPTIONS.searchPadding : FIT_OPTIONS.padding
                        }
                    );
                }
            });
        };

        map.on('click', onClick);

        return () => map.un('click', onClick);
    }, [map, searchParams, withSearchResults]);

    return <div className="overview-map" id="ol-overview-map" style={ mapStyle } />;
}


const createMap = (): Map => {

    const map = new Map({
        target: 'ol-overview-map',
        controls: defaultControls({ attribution: false }).extend([ new Attribution({ collapsible: false })]),
        view: new View({
            center: [0, 0],
            zoom: 0
        })
    });

    const mapboxStyleUrl = getMapboxStyleUrl();
    if (mapboxStyleUrl) {
        olms(map, mapboxStyleUrl);
    } else {
        map.addLayer(new TileLayer({ source: new OSM() }));
    }

    return map;
};


const getMapboxStyleUrl = (): string|undefined => {

    const accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) return undefined;

    const styleUrl = process.env.REACT_APP_MAPBOX_STYLE_URL;
    if (styleUrl) {
        const separator = styleUrl.includes('?') ? '&' : '?';
        return `${styleUrl}${separator}access_token=${accessToken}`;
    }

    const styleId = process.env.REACT_APP_MAPBOX_STYLE_ID ?? DEFAULT_MAPBOX_STYLE_ID;
    return `https://api.mapbox.com/styles/v1/${styleId}?access_token=${accessToken}`;
};


const getGeoJSONLayer = (featureCollection: FeatureCollection, t: TFunction): VectorLayer => {

    const vectorSource = new VectorSource({
        features: featureCollection
            ? new GeoJSON().readFeatures(featureCollection, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            }) : []
    });

    const clusterSource = new Cluster({
        distance: CLUSTER_DISTANCE,
        source: vectorSource
    });

    const vectorLayer = new VectorLayer({
        source: clusterSource,
        style: getStyle(t),
        updateWhileAnimating: true,
        zIndex: Number.MAX_SAFE_INTEGER
    });

    return vectorLayer;
};


const getStyle = (t: TFunction) => (clusterFeature: OlFeature): Style => {

    const size = clusterFeature.get('features').length;
    const labelText = size === 1
        ? clusterFeature.get('features')[0].get('label')
        : size === 2
            ? clusterFeature.get('features')[0].get('label') + '\n' + clusterFeature.get('features')[1].get('label')
            : size.toString() + ' ' + t('projectsOverview.projects');

    return new Style({
        image: new Icon({
            src: size === 1 ? '/marker-icon.svg' : '/cluster-icon.svg',
            scale: 1.5
        }),
        text: new Text({
            text: labelText,
            fill: new Fill({ color: 'black' }),
            stroke: new Stroke({ color: 'white', width: 3 }),
            offsetY: size !== 2 ? 23 : 33,
            font: 'normal 15px Cargan',
            backgroundFill: new Fill({ color: [255, 255, 255, 0.01] }),
        })
    });
};


const createFeatureCollection = (documents: ResultDocument[], filter: ResultFilter): FeatureCollection => {

    if (!documents || documents.length === 0) return undefined;

    const filteredDocuments = filterDocuments(documents, filter)
        .filter(document => document.resource.geometry_wgs84);

    if (filteredDocuments.length === 0) return undefined;

    return {
        type: 'FeatureCollection',
        features: filteredDocuments
            .map(document => createFeature(document, filter))
    };
};


const createFeature = (document: ResultDocument, filter: ResultFilter): Feature => ({
    type: 'Feature',
    geometry: document.resource.geometry_wgs84,
    properties: {
        identifier: document.resource.identifier,
        label: createFeatureLabel(document, filter)
    }
});


const createFeatureLabel = (document: ResultDocument, filter?: ResultFilter): string => {

    const projectBucket = filter?.values.find(
        (bucket: FilterBucket) => bucket.value.name === document.project
    ) as FilterBucket;

    return getProjectLabel(document) + (
        projectBucket && projectBucket.count > 0
            ? ` (${projectBucket.count})`
            : ''
    );
};


const filterDocuments = (documents: ResultDocument[], filter?: ResultFilter): ResultDocument[] => {

    if (!filter) return documents;

    return documents.filter(document => filter.values.map(
        (bucket: FilterBucket) => bucket.value.name).includes(document.project)
    );
};


const mapStyle: CSSProperties = {
    height: `calc(100vh - ${NAVBAR_HEIGHT}px)`
};
