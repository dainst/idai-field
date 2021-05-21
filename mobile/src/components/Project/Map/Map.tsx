import { Document, FieldGeometryType, ProjectConfiguration } from 'idai-field-core';
import React, { ReactElement, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Matrix4 } from 'react-native-redash';
import { Circle } from 'react-native-svg';
import {
    GeoLineString, GeoMultiLineString, GeoMultiPoint,
    GeoMultiPolygon, GeoPoint, GeoPolygon, getGeometryBoundings,
    processTransform2d
} from './geo-svg';
import { ViewPort } from './geo-svg/geojson-cs-to-svg-cs/viewport-utils/viewport-utils';
import { GeoMap, setupGeoMap } from './geometry-map/geometry-map';
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

    //const geometryBoundings = useMemo(() => getGeometryBoundings(geoDocuments),[geoDocuments]);
    const viewPort = useRef<ViewPort>();
    const { geoMap, transformationMatrix } = useMemo(() =>
        setupGeoMap(geoDocuments, viewPort.current),[viewPort, geoDocuments]);
    // const transformationMatrix = useMemo(() =>
    //         setupTransformationMatrix(geometryBoundings,viewPort.current),[geometryBoundings,viewPort]);
    // const transformedGeoDocuments = useMemo(() => sortDocumentByGeometryArea(
    //         transformDocumentsGeometry(transformationMatrix, geoDocuments)),
    //     [transformationMatrix, geoDocuments]) ;

    const [highlightedDocId, setHighlightedDocId] = useState<string | null>(null);
    const [isModalVisible, setModalVisible] = useState(false);
   

    const selectDocHandler = (docId: string) => {

        
        geoMap!.get(docId)!.isHighlighted = true;
        if(highlightedDocId !== null) geoMap!.get(highlightedDocId)!.isHighlighted = false;
        setHighlightedDocId(docId);
        setModalVisible(true);
    };

    const unSelectDocHandler = () => {

        setModalVisible(false);
        setHighlightedDocId(null);
    };

    const handleLayoutChange = (event: LayoutChangeEvent) => {

        viewPort.current = event.nativeEvent.layout;
    };


    return (
        <View style={ { flex: 1 } }>
            <View onLayout={ handleLayoutChange } style={ styles.mapContainer }>
                {geoMap && viewPort.current && transformationMatrix ?
                    <SvgMap style={ styles.svg } viewPort={ viewPort.current }
                        // eslint-disable-next-line max-len
                        viewBox={ computeViewBox(selectedGeoDocuments, transformationMatrix, viewPort.current).join(' ') }>
                        {Array.from(geoMap.keys()).map(docId =>
                            renderGeoSvgElement(geoMap,config,selectDocHandler,docId))
                        }
                    </SvgMap> :
                    <Text>No docs available</Text>
                }
            </View>
            <MapBottomDrawer
                closeHandler={ unSelectDocHandler }
                document={ highlightedDocId ? geoMap!.get(highlightedDocId)!.doc : null }
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
        geoMap: GeoMap,
        config: ProjectConfiguration,
        onPressHandler: (docId: string) => void,
        docId: string): ReactElement => {
    
    const mapEntry = geoMap.get(docId)!;
    const geoType = mapEntry.doc.resource.geometry.type as FieldGeometryType;
    const category = mapEntry.doc.resource.category;
    //const geometry: FieldGeometry = transformedDocument.doc.resource.geometry;
    const props = {
        coordinates: mapEntry.transformedCoords,
        ...getDocumentFillOpacityPress(
            geoType,
            config.getColorForCategory(category),
            onPressHandler.bind(this,docId),
            mapEntry.isHighlighted,
            mapEntry.isSelected),
        key: docId
    };
 

    switch(geoType){
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
            console.error(`Unknown type: ${geoType}`);
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
