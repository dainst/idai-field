import { Position } from 'geojson';
import { Document, FieldGeometry } from 'idai-field-core';
import { Text } from 'native-base';
import React, { ReactElement } from 'react';
import { Circle, G } from 'react-native-svg';
import SvgMap from '../SvgMap/SvgMap';
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
                <SvgMap>
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
