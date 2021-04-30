import { Position } from 'geojson';
import { Document, FieldGeometry } from 'idai-field-core';
import { Text } from 'native-base';
import React, { ReactElement, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Circle, G } from 'react-native-svg';
import SvgMap from '../SvgMap/SvgMap';
import { viewBox } from './constants';
import { getGeometryBoundings } from './cs-transform-utils';
import {
    GeoLineString, GeoMultiLineString, GeoMultiPoint,
    GeoMultiPolygon, GeoPoint, GeoPolygon, transformGeojsonToSvg
} from './geo-svg';
import { getDocumentFillAndOpacity } from './svg-element-style';

interface MapProps {
    geoDocuments: Document[];
    selectedGeoDocuments: Document[];
    navigateToDocument: (docId: string) => void;
}


const Map: React.FC<MapProps> = ({ geoDocuments, selectedGeoDocuments, navigateToDocument }) => {

    const geometryBoundings = useMemo(()=> getGeometryBoundings(geoDocuments),[geoDocuments]);

  
    return (
        <>
            {geoDocuments && geometryBoundings ?
                <SvgMap viewBox={ viewBox.join(' ') } style={ styles.svg }>
                    {geoDocuments.map(doc =>(
                        <G key={ doc._id }>
                            {renderGeoSvgElement(
                                doc,
                                transformGeojsonToSvg.bind(this, geometryBoundings),
                                selectedGeoDocuments,
                                selectedGeoDocuments.length === geoDocuments.length,
                                navigateToDocument)}
                        </G>))
                    }
                </SvgMap> :
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
