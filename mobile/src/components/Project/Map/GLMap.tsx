import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { Document, FieldGeometry, ProjectConfiguration } from 'idai-field-core';
import React, { useCallback, useEffect, useState } from 'react';
import { GestureResponderEvent, StyleSheet } from 'react-native';
import { Matrix4 } from 'react-native-redash';
import { OrthographicCamera, Raycaster, Scene, Vector2 } from 'three';
import { CameraView } from '../../../hooks/use-Nmapdata';
import usePrevious from '../../../hooks/use-previous';
import useToast from '../../../hooks/use-toast';
import { colors } from '../../../utils/colors';
import { ToastType } from '../../common/Toast/ToastProvider';
import { ViewPort } from './geo-svg';
import {
    lineStringToShape, multiPointToShape, ObjectChildValues, ObjectData,
    pointToShape, polygonToShape
} from './geojson-gl-shape';
interface GLMapProps {
    config: ProjectConfiguration;
    setHighlightedDocId: (docId: string) => void;
    viewPort: ViewPort;
    cameraView: CameraView | undefined;
    transformMatrix: Matrix4 | undefined;
    selectedDocumentIds: string[];
    geoDocuments: Document[];
}


const GLMap: React.FC<GLMapProps> = ({
     config, setHighlightedDocId, viewPort, cameraView, transformMatrix, selectedDocumentIds, geoDocuments }) => {


    let timeout: number;
    const [camera, setCamera] = useState<OrthographicCamera>(new OrthographicCamera(0,0,100,100));
    const [scene, _setScene] = useState<Scene>(new Scene());
   
    const { showToast } = useToast();
    const previousSelectedDocIds = usePrevious(selectedDocumentIds);


    useEffect(() => {
        
        if(viewPort){
            scene.clear();
            const maxSize = Math.max(viewPort.width, viewPort.height );
            setCamera(new OrthographicCamera(
                viewPort.x,
                maxSize,
                maxSize,
                viewPort.y));
        }
        
    },[ viewPort, scene]);


    const updateCamera = useCallback((cameraView: CameraView | undefined) => {

        if(!camera || !cameraView) return;
        const { left, right, top, bottom } = cameraView;
        camera.left = left;
        camera.right = right;
        camera.top = top;
        camera.bottom = bottom;
        camera.updateProjectionMatrix();
    },[camera]);


    useEffect(() => updateCamera(cameraView),[cameraView, updateCamera]);


    useEffect(() => {
    
        if(!transformMatrix || !geoDocuments.length) return;

        geoDocuments.forEach((doc) => {
            
            const geometry = doc.resource.geometry as FieldGeometry;
            
            switch(geometry.type){
                case 'Polygon':
                case 'MultiPolygon':
                    polygonToShape(transformMatrix, scene, config,doc, geometry.coordinates );
                    break;
                case 'LineString':
                    lineStringToShape(transformMatrix, scene, config,doc, geometry.coordinates);
                    break;
                case 'Point':
                    pointToShape(transformMatrix, scene, config, doc, geometry.coordinates);
                    break;
                case 'MultiPoint':
                    multiPointToShape(transformMatrix,scene, config, doc, geometry.coordinates);
                    break;
                default:
                    showToast(ToastType.Error, `Unknown geometry type ${geometry.type}`);
                    break ;
            }
        });
    },[geoDocuments, config ,scene, transformMatrix, showToast]);


    useEffect(() => {

        if(previousSelectedDocIds){
            previousSelectedDocIds.forEach(docId => {
                const object = scene.getObjectByProperty('uuid',docId);
                
                if(object){
                    object.userData = { ...object.userData, isSelected: false };
                    
                    object.children.forEach(child => {
                        child.visible = child.name === ObjectChildValues.notSelected ? true : false;
                    });
                }
            });
        }
        
        if(!selectedDocumentIds) return;
        selectedDocumentIds.forEach(docId => {
         
            const object = scene.getObjectByProperty('uuid',docId);
            
            if(object){
                object.userData = { ...object.userData, isSelected: true };
                object.children.forEach(child => {
                    child.visible = child.name === ObjectChildValues.selected ? true : false;
                });
            }

        });
    },[scene, selectedDocumentIds, previousSelectedDocIds]);

    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => clearTimeout(timeout),[]);

    if (!camera || !scene.children.length) return null;

    
    const _onContextCreate = async(gl: ExpoWebGLRenderingContext) => {

        const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
        const sceneColor = colors.containerBackground;

        const renderer = new Renderer({ gl });
        renderer.setSize(width, height);
        renderer.setClearColor(sceneColor);

        camera.position.set(0, 0, 5);
        // camera.zoom = 2;
        // camera.updateProjectionMatrix();

        const render = () => {
            timeout = requestAnimationFrame(render);
            //update();
            renderer.render(scene, camera);
            gl.endFrameEXP();
        };
        render();
    };


    const onPress = (e: GestureResponderEvent) => {

        const vec = new Vector2(
            (e.nativeEvent.locationX / viewPort.width ) * 2 - 1,
            -(e.nativeEvent.locationY / viewPort.height) * 2 + 1);
        const raycaster = new Raycaster();
        raycaster.setFromCamera(vec, camera);
        const intersections = raycaster.intersectObjects(scene.children,true);
        
        for(const intersection of intersections){
            const object = intersection.object;
            const parent = object.parent;
            if(parent){
                const objectData = parent.userData as ObjectData;
                if(objectData.isSelected) setHighlightedDocId(parent.uuid);
            }
        }
    };


    return (
        <GLView
            onTouchStart={ onPress }
            style={ styles.container }
            onContextCreate={ _onContextCreate }
        />
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1
    }
});


export default GLMap;