import { Document, FieldGeometry } from 'idai-field-core';
import { Box, Text } from 'native-base';
import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { GeoLineString, GeoMultiLineString, GeoMultiPoint, GeoMultiPolygon, GeoPoint, GeoPolygon } from './geo-svg';
import { defineViewBox, getViewBoxHeight } from './geomerty-scaling-utils';
interface MapProps {
    geoDocuments: Document[]
}
const Map: React.FC<MapProps> = ({ geoDocuments }) => {

    const viewBox = defineViewBox(geoDocuments);
  
    return (
        <Box style={ styles.container }>
            {geoDocuments ?
                <Svg style={ styles.svg } viewBox={ viewBox } preserveAspectRatio="none">
                    {geoDocuments.map(doc =>(
                        <G key={ doc._id }>
                            {renderGeoSvgElement(doc, viewBox)}
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

const renderGeoSvgElement = (document: Document, viewBox: string): ReactElement => {
    
    const viewBoxHeight = getViewBoxHeight(viewBox);
    const geometry: FieldGeometry = document.resource.geometry;

    switch(geometry.type){
        case('Polygon'):
            return <GeoPolygon
                coordinates={ geometry.coordinates }
                fill="blue"
                viewBoxHeight={ viewBoxHeight } />;
        case('MultiPolygon'):
            return <GeoMultiPolygon
                coordinates={ geometry.coordinates }
                fill="red"
                viewBoxHeight={ viewBoxHeight } />;
        case('LineString'):
            return <GeoLineString
                coordinates={ geometry.coordinates }
                stroke="green"
                viewBoxHeight={ viewBoxHeight } />;
        case('MultiLineString'):
            return <GeoMultiLineString
                coordinates={ geometry.coordinates }
                stroke="green"
                viewBoxHeight={ viewBoxHeight } />;
        case('Point'):
            return <GeoPoint
                point={ geometry.coordinates }
                fill="black"
                viewBoxHeight={ viewBoxHeight } />;
        case('MultiPoint'):
            return <GeoMultiPoint
                points={ geometry.coordinates }
                fill="yellow"
                viewBoxHeight={ viewBoxHeight } />;
        default:
            return <Circle />;

    }
};


export default Map;