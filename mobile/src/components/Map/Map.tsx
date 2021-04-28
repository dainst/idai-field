import { Position } from 'geojson';
import { Document, FieldGeometry } from 'idai-field-core';
import { Text } from 'native-base';
import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { Circle, G } from 'react-native-svg';
import NSvgMap from '../SvgMap/NSvgMap';
import { viewBox } from './constants';
import { getGeometryBoundings } from './cs-transform-utils';
import {
    GeoLineString, GeoMultiLineString, GeoMultiPoint,
    GeoMultiPolygon, GeoPoint, GeoPolygon, transformGeojsonToSvg
} from './geo-svg';

interface MapProps {
    geoDocuments: Document[];
    selectedGeoDocuments: Document[];
}


const Map: React.FC<MapProps> = ({ geoDocuments, selectedGeoDocuments }) => {

    const geometryBoundings = getGeometryBoundings(geoDocuments);
  
    return (
        <>
            {geoDocuments && geometryBoundings ?
                <NSvgMap viewBox={ viewBox.join(' ') } style={ styles.svg }>
                    {geoDocuments.map(doc =>(
                        <G key={ doc._id }>
                            {renderGeoSvgElement(doc, transformGeojsonToSvg.bind(this, geometryBoundings),
                                selectedGeoDocuments )}
                        </G>))
                    }
                </NSvgMap> :
                <Text>No docs available</Text>
            }
        </>
    );
};

const styles = StyleSheet.create({
    svg: {
        height: '100%',
        width: '100%'
    },
});


const renderGeoSvgElement = (document: Document, csTransformFunc: (pos: Position) => Position,
    selectedDocuments: Document[]): ReactElement => {
    
    const geometry: FieldGeometry = document.resource.geometry;
    const props = {
        coordinates: geometry.coordinates,
        csTransformFunction: csTransformFunc,
        opacity: selectedDocuments.find((doc: Document) => doc.resource.id === document.resource.id) ? 1 : 0.5
    };

    switch(geometry.type){
        case('Polygon'):
            return <GeoPolygon { ...props } fill="blue" />;
        case('MultiPolygon'):
            return <GeoMultiPolygon { ...props } fill="red" />;
        case('LineString'):
            return <GeoLineString { ...props } stroke="green" />;
        case('MultiLineString'):
            return <GeoMultiLineString { ...props } stroke="green" />;
        case('Point'):
            return <GeoPoint { ...props } fill="#7f32a8" />;
        case('MultiPoint'):
            return <GeoMultiPoint { ...props } fill="yellow" />;
        default:
            console.error(`Unknown type: ${geometry.type}`);
            return <Circle />;

    }
};


export default Map;
