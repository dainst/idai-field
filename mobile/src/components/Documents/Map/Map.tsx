import { Position } from 'geojson';
import { Document, FieldGeometry, ProjectConfiguration } from 'idai-field-core';
import { Text, View } from 'native-base';
import React, { ReactElement, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet } from 'react-native';
import { Matrix4 } from 'react-native-redash';
import { Circle, G } from 'react-native-svg';
import {
    GeoLineString, GeoMultiLineString, GeoMultiPoint,
    GeoMultiPolygon, GeoPoint, GeoPolygon,
    processTransform2d, setupTransformationMatrix
} from './geo-svg';
import { getGeometryBoundings } from './geo-svg/geojson-cs-to-svg-cs/cs-transform-utils';
import { ViewPort } from './geo-svg/geojson-cs-to-svg-cs/viewport-utils/viewport-utils';
import MapBottomDrawer from './MapBottomDrawer';
import { getDocumentFillAndOpacity } from './svg-element-style';
import SvgMap from './SvgMap/SvgMap';

interface MapProps {
    geoDocuments: Document[];
    selectedGeoDocuments: Document[];
    config: ProjectConfiguration;
    navigateToDocument: (docId: string) => void;
}


const Map: React.FC<MapProps> = ({ geoDocuments, selectedGeoDocuments, config, navigateToDocument }) => {

    const geometryBoundings = useMemo(()=> getGeometryBoundings(geoDocuments),[geoDocuments]);
    const viewPort = useRef<ViewPort>();
    const transformationMatrix = setupTransformationMatrix(geometryBoundings,viewPort.current);

    const [selectedDocument, setSelectedDocument] = useState<Document>();
    const [isModalVisible, setModalVisible] = useState(false);

    const selectDocHandler = (doc: Document) => {

        setSelectedDocument(doc);
        setModalVisible(true);
    };

    const handleLayoutChange = (event: LayoutChangeEvent) => {

        viewPort.current = event.nativeEvent.layout;
    };


    return (
        <View style={ { flex: 1 } }>
            <View onLayout={ handleLayoutChange } style={ styles.mapContainer }>
                {geoDocuments && geometryBoundings && viewPort.current ?
                    <SvgMap style={ styles.svg } viewPort={ viewPort.current }
                        // eslint-disable-next-line max-len
                        viewBox={ computeViewBox(selectedGeoDocuments, transformationMatrix, viewPort.current).join(' ') }>
                        {geoDocuments.map(doc =>(
                            <G key={ doc._id }>
                                {renderGeoSvgElement(
                                    doc,
                                    processTransform2d.bind(this, transformationMatrix),
                                    selectedGeoDocuments,
                                    selectedGeoDocuments.length === geoDocuments.length,
                                    config,
                                    selectDocHandler)}
                            </G>))
                        }
                    </SvgMap> :
                    <Text>No docs available</Text>
                }
            </View>
            <MapBottomDrawer
                closeHandler={ () => setModalVisible(false) }
                document={ selectedDocument }
                isVisible={ isModalVisible }
                config={ config }
                navigateToDocument={ navigateToDocument } />
        </View>
    );
};

const styles = StyleSheet.create({
    mapContainer: {
        flex: 1,
    },
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
        config: ProjectConfiguration,
        onPressHandler: (doc: Document) => void): ReactElement => {
    
    const geometry: FieldGeometry = document.resource.geometry;
    const props = {
        coordinates: geometry.coordinates,
        csTransformFunction: csTransformFunc,
        ...getDocumentFillAndOpacity(document, selectedDocuments, noDocsSelected, config, geometry.type),
        onPress: () => onPressHandler(document)
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


const computeViewBox = (selectedDocuments: Document[], transformationMatrix: Matrix4, viewPort: ViewPort): number[] => {
    
    if(!selectedDocuments.length ) return [viewPort.x,viewPort.y,viewPort.width, viewPort.height];
    const padding = 20;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { minX, minY, maxX, maxY } = getGeometryBoundings(selectedDocuments)!;
    const [xMinVp, yMinVp] = processTransform2d(transformationMatrix,[minX, minY]);
    const [xMaxVp, yMaxVp] = processTransform2d(transformationMatrix,[maxX, maxY]);

    const viewBox = [xMinVp - padding, yMaxVp - padding, xMaxVp - xMinVp + 2 * padding, yMinVp - yMaxVp + 2 * padding];
    return viewBox;

};

export default Map;
