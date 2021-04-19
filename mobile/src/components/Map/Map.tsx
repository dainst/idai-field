import { Document, FieldGeometry } from 'idai-field-core';
import { Box, Text } from 'native-base';
import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { GeoLineString, GeoMultiLineString, GeoMultiPoint, GeoMultiPolygon, GeoPoint, GeoPolygon } from './geo-svg';
import { GeometryBoundings, getGeometryBoundings } from './geomerty-scaling-utils';

interface MapProps {
    geoDocuments: Document[]
}
const Map: React.FC<MapProps> = ({ geoDocuments }) => {

    const viewBox: [number, number, number, number] = [0, 0, 100, 100];
    const geometryBoundings = getGeometryBoundings(geoDocuments);
  
    return (
        <Box style={ styles.container }>
            {geoDocuments && geometryBoundings ?
                <Svg style={ styles.svg } viewBox={ viewBox.join(' ') } >
                    {geoDocuments.map(doc =>(
                        <G key={ doc._id }>
                            {renderGeoSvgElement(doc, viewBox, geometryBoundings)}
                        </G>))
                    }
                </Svg> :
                <Text>No docs available</Text>
            }
        </Box>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    svg: {
        height: 500,
        width: 500,
        borderWidth: 1,
        borderColor: 'black'
    }
});

const renderGeoSvgElement = (
    document: Document,
    viewBox: [number, number, number, number],
    geometryBoundings: GeometryBoundings): ReactElement => {
    
    const geometry: FieldGeometry = document.resource.geometry;

    switch(geometry.type){
        case('Polygon'):
            return <GeoPolygon
                coordinates={ geometry.coordinates }
                fill="blue"
                viewBox={ viewBox }
                geometryBoundings={ geometryBoundings } />;
        case('MultiPolygon'):
            return <GeoMultiPolygon
                coordinates={ geometry.coordinates }
                fill="red"
                viewBox={ viewBox }
                geometryBoundings={ geometryBoundings } />;
        case('LineString'):
            return <GeoLineString
                coordinates={ geometry.coordinates }
                stroke="green"
                viewBox={ viewBox }
                geometryBoundings={ geometryBoundings } />;
        case('MultiLineString'):
            return <GeoMultiLineString
                coordinates={ geometry.coordinates }
                stroke="green"
                viewBox={ viewBox }
                geometryBoundings={ geometryBoundings } />;
        case('Point'):
            return <GeoPoint
                point={ geometry.coordinates }
                fill="black"
                viewBox={ viewBox }
                geometryBoundings={ geometryBoundings } />;
        case('MultiPoint'):
            return <GeoMultiPoint
                points={ geometry.coordinates }
                fill="yellow"
                viewBox={ viewBox }
                geometryBoundings={ geometryBoundings } />;
        default:
            return <Circle />;

    }
};


export default Map;