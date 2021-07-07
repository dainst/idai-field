import { Feature, FeatureCollection } from 'geojson';
import { Feature as OlFeature, MapBrowserEvent } from 'ol';
import olms from 'ol-mapbox-style';
import { Attribution, defaults as defaultControls } from 'ol/control';
import GeoJSON from 'ol/format/GeoJSON';
import { Geometry } from 'ol/geom';
import { Vector as VectorLayer } from 'ol/layer';
import Map from 'ol/Map';
import { Vector as VectorSource } from 'ol/source';
import { Fill, Icon, Stroke, Style, Text } from 'ol/style';
import View from 'ol/View';
import React, { CSSProperties, ReactElement, useEffect, useState } from 'react';
import { FilterBucket, ResultDocument, ResultFilter } from '../../api/result';
import { NAVBAR_HEIGHT, SIDEBAR_WIDTH } from '../../constants';
import { useSearchParams } from '../../shared/location';
import { getProjectLabel } from '../projects';
import './overview-map.css';


const MAPBOX_KEY = 'pk.eyJ1Ijoic2ViYXN0aWFuY3V5IiwiYSI6ImNrOTQxZjA4MzAxaGIzZnBwZzZ4c21idHIifQ._2-exYw4CZRjn9WoLx8i1A';
const FIT_OPTIONS = { padding: [ 100, 100, 100, SIDEBAR_WIDTH + 100 ], duration: 500 };

export default function OverviewMap({ documents, filter }
        : { documents: ResultDocument[], filter?: ResultFilter }): ReactElement {

    const [map, setMap] = useState<Map>(null);
    const searchParams = useSearchParams();

    useEffect(() => {

        const newMap = createMap();
        setMap(newMap);

        return () => newMap ?? newMap.setTarget(null);
    }, []);

    useEffect(() => {

        if (!map || !documents?.length) return;

        const featureCollection = createFeatureCollection(documents, filter);
        if (!featureCollection) return;

        const vectorLayer = getGeoJSONLayer(featureCollection);
        map.addLayer(vectorLayer);

        map.getView().fit((vectorLayer.getSource() as VectorSource<Geometry>).getExtent(),
            { padding: FIT_OPTIONS.padding });

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
    }, [map, documents, filter]);

    useEffect(() => {

        if (!map) return;

        const onClick = (e: MapBrowserEvent) => {
            e.preventDefault();
            map.forEachFeatureAtPixel(e.pixel, feature => {
                if (feature.getProperties().identifier) {
                    // this causes openlayers to throw an error, presumably because
                    // the map element does not exist when some event listener fires
                    // history.push(`/project/${feature.getProperties().identifier}`);

                    // so instead reload the application when selecting a project
                    let href = `/project/${feature.getProperties().identifier}`;
                    if (searchParams.toString()) href += `/search/?${searchParams}`;
                    window.location.href = href;
                }
            });
        };

        map.on('click', onClick);

        return () => map.un('click', onClick);
    }, [map, searchParams]);

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

    olms(map, 'https://api.mapbox.com/styles/v1/sebastiancuy/ckff2undp0v1o19mhucq9oycb?access_token=' + MAPBOX_KEY);

    return map;
};


const getGeoJSONLayer = (featureCollection: FeatureCollection): VectorLayer => {

    if (!featureCollection) return;

    const vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(featureCollection, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        })
    });

    const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: getStyle,
        updateWhileAnimating: true,
        zIndex: Number.MAX_SAFE_INTEGER
    });

    return vectorLayer;
};


const getStyle = (feature: OlFeature): Style => {

    return new Style({
        image: new Icon({
            src: '/marker-icon.svg',
            scale: 1.5
        }),
        text: new Text({
            text: feature.get('label'),
            fill: new Fill({ color: 'black' }),
            stroke: new Stroke({ color: 'white', width: 3 }),
            offsetY: 23,
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
