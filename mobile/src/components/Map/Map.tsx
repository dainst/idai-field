import { Position } from 'geojson';
import { Document, FieldGeometry } from 'idai-field-core';
import { Box, Text } from 'native-base';
import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
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
        <Box style={ styles.container }>
            {geoDocuments && geometryBoundings ?
                <Svg style={ styles.svg } viewBox={ viewBox.join(' ') } >
                    {geoDocuments.map(doc =>(
                        <G key={ doc._id }>
                            {renderGeoSvgElement(doc, transformGeojsonToSvg.bind(this, geometryBoundings) )}
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
        height: '100%',
        width: '100%'
    }
});

const renderGeoSvgElement = (document: Document, csTransformFunc: (pos: Position) => Position): ReactElement => {
    
    const geometry: FieldGeometry = document.resource.geometry;

    switch(geometry.type){
        case('Polygon'):
            return <GeoPolygon
                coordinates={ geometry.coordinates }
                fill="blue"
                csTransformFunction={ csTransformFunc } />;
        case('MultiPolygon'):
            return <GeoMultiPolygon
                coordinates={ geometry.coordinates }
                fill="red"
                csTransformFunction={ csTransformFunc } />;
        case('LineString'):
            return <GeoLineString
                coordinates={ geometry.coordinates }
                stroke="green"
                csTransformFunction={ csTransformFunc } />;
        case('MultiLineString'):
            return <GeoMultiLineString
                coordinates={ geometry.coordinates }
                stroke="green"
                csTransformFunction={ csTransformFunc } />;
        case('Point'):
            return <GeoPoint
                coordinates={ geometry.coordinates }
                fill="black"
                csTransformFunction={ csTransformFunc } />;
        case('MultiPoint'):
            return <GeoMultiPoint
                coordinates={ geometry.coordinates }
                fill="yellow"
                csTransformFunction={ csTransformFunc } />;
        default:
            return <Circle />;

    }
};


export default Map;
