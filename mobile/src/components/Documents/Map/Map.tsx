import { Position } from 'geojson';
import { Document, FieldGeometry } from 'idai-field-core';
import { Text, View } from 'native-base';
import React, { ReactElement, useMemo, useRef } from 'react';
import { LayoutChangeEvent, StyleSheet } from 'react-native';
import { Circle, G } from 'react-native-svg';
import { standardViewBox } from './constants';
import { getGeometryBoundings } from './cs-transform-utils';
import {
    GeoLineString, GeoMultiLineString, GeoMultiPoint,
    GeoMultiPolygon, GeoPoint, GeoPolygon, transformGeojsonToSvgViewPort
} from './geo-svg';
import { ViewPort } from './geo-svg/geojson-cs-to-svg-cs/geojson-cs-to-svg-cs';
import { getDocumentFillAndOpacity } from './svg-element-style';
import SvgMap from './SvgMap/SvgMap';

interface MapProps {
    geoDocuments: Document[];
    selectedGeoDocuments: Document[];
    navigateToDocument: (docId: string) => void;
}


const Map: React.FC<MapProps> = ({ geoDocuments, selectedGeoDocuments, navigateToDocument }) => {

    const geometryBoundings = useMemo(()=> getGeometryBoundings(geoDocuments),[geoDocuments]);
    const viewPort = useRef<ViewPort>();

    const handleLayoutChange = (event: LayoutChangeEvent) => {
        viewPort.current = event.nativeEvent.layout;
        
    };
  
    return (
        <View onLayout={ handleLayoutChange }>
            {geoDocuments && geometryBoundings && viewPort.current ?
                <SvgMap viewBox={ standardViewBox.join(' ') } style={ styles.svg } viewPort={ viewPort.current }>
                    {geoDocuments.map(doc =>(
                        <G key={ doc._id }>
                            {renderGeoSvgElement(
                                doc,
                                transformGeojsonToSvgViewPort.bind(this, geometryBoundings),
                                selectedGeoDocuments,
                                selectedGeoDocuments.length === geoDocuments.length,
                                navigateToDocument)}
                        </G>))
                    }
                </SvgMap> :
                <Text>No docs available</Text>
            }
        </View>
    );
};

const styles = StyleSheet.create({
    svg: {
        height: '100%',
        width: '100%'
    },
});


const renderGeoSvgElement = (
        document: Document,
        csTransformFunc: (pos: Position) => Position,
        selectedDocuments: Document[],
        noDocsSelected: boolean,
        onPressHandler: (id: string) => void): ReactElement => {
    
    const geometry: FieldGeometry = document.resource.geometry;
    const props = {
        coordinates: geometry.coordinates,
        csTransformFunction: csTransformFunc,
        ...getDocumentFillAndOpacity(document, selectedDocuments, noDocsSelected),
        onPress: () => onPressHandler(document.resource.id)
    };
 

    switch(geometry.type){
        case('Polygon'):
            return <GeoPolygon { ...props } />;
        case('MultiPolygon'):
            return <GeoMultiPolygon { ...props } />;
        case('LineString'):
            return <GeoLineString { ...props } />;
        case('MultiLineString'):
            return <GeoMultiLineString { ...props } />;
        case('Point'):
            return <GeoPoint { ...props } />;
        case('MultiPoint'):
            return <GeoMultiPoint { ...props } />;
        default:
            console.error(`Unknown type: ${geometry.type}`);
            return <Circle />;

    }
};


export default Map;
