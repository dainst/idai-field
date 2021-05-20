import { Document, FieldGeometry, ProjectConfiguration } from 'idai-field-core';
import React, { ReactElement, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Matrix4 } from 'react-native-redash';
import { Circle, G } from 'react-native-svg';
import {
    GeoLineString, GeoMultiLineString, GeoMultiPoint,
    GeoMultiPolygon, GeoPoint, GeoPolygon, getGeometryBoundings,
    processTransform2d, setupTransformationMatrix,
    sortDocumentByGeometryArea, transformDocumentsGeometry, TransformedDocument
} from './geo-svg';
import { ViewPort } from './geo-svg/geojson-cs-to-svg-cs/viewport-utils/viewport-utils';
import MapBottomDrawer from './MapBottomDrawer';
import { getDocumentFillOpacityPress } from './svg-element-props';
import SvgMap from './SvgMap/SvgMap';

interface MapProps {
    geoDocuments: Document[];
    selectedGeoDocuments: Document[];
    config: ProjectConfiguration;
    navigateToDocument: (docId: string) => void;
}


const Map: React.FC<MapProps> = ({ geoDocuments, selectedGeoDocuments, config, navigateToDocument }) => {

    const geometryBoundings = useMemo(() => getGeometryBoundings(geoDocuments),[geoDocuments]);
    const viewPort = useRef<ViewPort>();
    const transformationMatrix = useMemo(() =>
            setupTransformationMatrix(geometryBoundings,viewPort.current),[geometryBoundings,viewPort]);
    const transformedGeoDocuments = useMemo(() => sortDocumentByGeometryArea(
            transformDocumentsGeometry(transformationMatrix, geoDocuments),
            selectedGeoDocuments.map(doc => doc._id)),
        [transformationMatrix, geoDocuments, selectedGeoDocuments]) ;

    
    const [highlightedDoc, setHighlightedDoc] = useState<Document | null>(null);
    const [isModalVisible, setModalVisible] = useState(false);

    const selectDocHandler = (doc: Document) => {

        setHighlightedDoc(doc);
        setModalVisible(true);
    };

    const unSelectDocHandler = () => {

        setModalVisible(false);
        setHighlightedDoc(null);
    };

    const handleLayoutChange = (event: LayoutChangeEvent) => {

        viewPort.current = event.nativeEvent.layout;
    };


    return (
        <View style={ { flex: 1 } }>
            <View onLayout={ handleLayoutChange } style={ styles.mapContainer }>
                {transformedGeoDocuments && geometryBoundings && viewPort.current ?
                    <SvgMap style={ styles.svg } viewPort={ viewPort.current }
                        // eslint-disable-next-line max-len
                        viewBox={ computeViewBox(selectedGeoDocuments, transformationMatrix, viewPort.current).join(' ') }>
                        {transformedGeoDocuments.map(tDoc =>(
                            <G key={ tDoc.doc._id }>
                                {renderGeoSvgElement(
                                    tDoc,
                                    selectedGeoDocuments,
                                    config,
                                    selectDocHandler,
                                    highlightedDoc)}
                            </G>))
                        }
                    </SvgMap> :
                    <Text>No docs available</Text>
                }
            </View>
            <MapBottomDrawer
                closeHandler={ unSelectDocHandler }
                document={ highlightedDoc }
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
        transformedDocument: TransformedDocument,
        selectedDocuments: Document[],
        config: ProjectConfiguration,
        onPressHandler: (doc: Document) => void,
        highlightedDoc: Document | null): ReactElement => {
    
    const geometry: FieldGeometry = transformedDocument.doc.resource.geometry;
    const props = {
        coordinates: transformedDocument.transformedCoordinates,
        ...getDocumentFillOpacityPress(
            transformedDocument.doc,
            selectedDocuments,
             config,
             geometry.type,
             onPressHandler.bind(this,transformedDocument.doc),
             highlightedDoc),
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
