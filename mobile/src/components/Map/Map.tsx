import { Position } from 'geojson';
import { Document, FieldGeometry } from 'idai-field-core';
import { Text } from 'native-base';
import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { Circle, G } from 'react-native-svg';
import SvgMap from '../SvgMap/SvgMap';
import { viewBox } from './constants';
import { getGeometryBoundings } from './cs-transform-utils';
import {
    GeoLineString, GeoMultiLineString, GeoMultiPoint,
    GeoMultiPolygon, GeoPoint, GeoPolygon, transformGeojsonToSvg
} from './geo-svg';
interface MapProps {
    geoDocuments: Document[]
}
const Map: React.FC<MapProps> = ({ geoDocuments }) => {

    const geometryBoundings = getGeometryBoundings(geoDocuments);
  
    return (
        <>
            {geoDocuments && geometryBoundings ?
                <SvgMap style={ styles.svg } viewBox={ viewBox.join(' ') } >
                    {geoDocuments.map(doc =>(
                        <G key={ doc._id }>
                            {renderGeoSvgElement(doc, transformGeojsonToSvg.bind(this, geometryBoundings) )}
                        </G>))
                    }
                </SvgMap> :
                <Text>No docs available</Text>
            }
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    svg: {
        flex: 1,
        borderColor: 'black',
        borderWidth: 1
    }
});

const renderGeoSvgElement = (document: Document, csTransformFunc: (pos: Position) => Position): ReactElement => {
    
    const geometry: FieldGeometry = document.resource.geometry;
    const props = {
        coordinates: geometry.coordinates,
        csTransformFunction: csTransformFunc,
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
