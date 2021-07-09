import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { Document, FieldGeometry, ProjectConfiguration } from 'idai-field-core';
import React, { useCallback, useEffect, useRef } from 'react';
import { GestureResponderEvent, PanResponder, PanResponderGestureState, StyleSheet } from 'react-native';
import { Matrix4 } from 'react-native-redash';
import { OrthographicCamera, Raycaster, Scene, Vector2 } from 'three';
import { CameraView } from '../../../hooks/use-Nmapdata';
import usePrevious from '../../../hooks/use-previous';
import { colors } from '../../../utils/colors';
import { ViewPort } from './geo-svg';
import {
    lineStringToShape, multiPointToShape, ObjectChildValues, ObjectData,
    pointToShape, polygonToShape
} from './geojson-gl-shape';
import { calcCenter, calcDistance } from './SvgMap/math-utils';

interface Coordinate {
    x: number;
    y: number;
}

const moveThreshold = 5;
// eslint-disable-next-line @typescript-eslint/no-empty-function
const no = () => {};
const yes = () => true;

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
    const camera = useRef<OrthographicCamera>(new OrthographicCamera(0,0,100,100) ).current;
    const scene = useRef<Scene>(new Scene() ).current;

    const previousSelectedDocIds = usePrevious(selectedDocumentIds);


    //boolean to init gestures
    const isZooming = useRef<boolean>(false);
    const isMoving = useRef<boolean>(false);

    //reference values set at the beginning of the gesture
    const initialTouch = useRef<Coordinate>({ x:0, y:0 });
    const initialX = useRef<number>(0);
    const initialY = useRef<number>(0);
    const initialZoom = useRef<number>(1);
    const initialDistance = useRef<number>(0);
   

    const shouldRespond = (e: GestureResponderEvent, gestureState: PanResponderGestureState):boolean =>
        e.nativeEvent.touches.length === 2 ||
        Math.pow(gestureState.dx,2) + Math.pow(gestureState.dy,2) >= moveThreshold;

    const panResponder = useRef(PanResponder.create({
        onPanResponderGrant: no,
        onPanResponderTerminate: no,
        onShouldBlockNativeResponder: yes,
        onPanResponderTerminationRequest: yes,
        onMoveShouldSetPanResponder: shouldRespond,
        onStartShouldSetPanResponder: shouldRespond,
        onMoveShouldSetPanResponderCapture: shouldRespond,
        onStartShouldSetPanResponderCapture: shouldRespond,
        onPanResponderMove: e => {
            const { nativeEvent: { touches } } = e;
            if(touches.length === 1){
                const [{ pageX, pageY }] = touches;
                touchHandler(pageX, pageY);
            } else if(touches.length === 2) {
                const [touch1, touch2] = touches;
                zoomHandler(touch1.pageX, touch1.pageY, touch2.pageX, touch2.pageY);
            } else return;
            e.preventDefault();
        },
        onPanResponderRelease: () => {
            isMoving.current = false;
            isZooming.current = false;
        }
    })).current;

    const touchHandler = (x: number, y: number): void => {

        if(!isMoving.current || isZooming.current){
            isMoving.current = true;
            isZooming.current = false;
            initialX.current = camera.position.x;
            initialY.current = camera.position.y;
            initialTouch.current = { x, y };
        } else {
            const dx = x - initialTouch.current.x;
            const dy = y - initialTouch.current.y;
            camera.position.set(initialX.current - dx / camera.zoom, initialY.current + dy / camera.zoom, 5);
            camera.updateProjectionMatrix();
        }
    };

    const zoomHandler = (x1: number, y1: number, x2: number, y2: number ): void => {
        const distance = calcDistance(x1, y1, x2, y2);
        const { x, y } = calcCenter(x1, y1, x2, y2);

        if(!isZooming.current){
            isZooming.current = true;
            initialTouch.current = { x,y };
            initialX.current = camera.position.x;
            initialY.current = camera.position.y;
            initialZoom.current = camera.zoom;
            initialDistance.current = distance;
        } else {
            const touchZoom = distance / initialDistance.current;
            const newZoom = initialZoom.current * touchZoom;
            camera.zoom = newZoom;
            camera.updateProjectionMatrix();
        }
    };


    useEffect(() => {
        
        if(viewPort){
            scene.clear();
            const maxSize = Math.max(viewPort.width, viewPort.height );
            camera.left = viewPort.x;
            camera.right = maxSize;
            camera.top = maxSize;
            camera.bottom = viewPort.y;
            camera.position.set(0,0,5);
            camera.updateProjectionMatrix();
        }
        
    },[ viewPort, scene, camera]);


    const updateCamera = useCallback((cameraView: CameraView | undefined, zoom?: number) => {

        if(!camera || !cameraView) return;
        const { left, right, top, bottom } = cameraView;
        camera.left = left;
        camera.right = right;
        camera.top = top;
        camera.bottom = bottom;
        if(zoom) camera.zoom = zoom;
        camera.position.set(0,0,5);
        camera.updateProjectionMatrix();
    },[camera]);


    useEffect(() => updateCamera(cameraView),[cameraView, updateCamera]);


    useEffect(() => {
    
        if(!transformMatrix || !geoDocuments.length) return;
        scene.clear();
        geoDocuments.forEach((doc) => {
            
            const geometry = doc.resource.geometry as FieldGeometry;
            
            switch(geometry.type){
                case 'Polygon':
                case 'MultiPolygon':
                    polygonToShape(transformMatrix, scene, config,doc, geometry.coordinates );
                    break;
                case 'LineString':
                case 'MultiLineString':
                    lineStringToShape(transformMatrix, scene, config,doc, geometry.coordinates);
                    break;
                case 'Point':
                    pointToShape(transformMatrix, scene, config, doc, geometry.coordinates);
                    break;
                case 'MultiPoint':
                    multiPointToShape(transformMatrix,scene, config, doc, geometry.coordinates);
                    break;
            }
        });
    },[geoDocuments, config ,scene, transformMatrix]);


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
    
    const _onContextCreate = async(gl: ExpoWebGLRenderingContext) => {

        const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

        const renderer = new Renderer({ gl });
        renderer.setSize(width, height);
        renderer.setClearColor(colors.containerBackground);

        camera.position.set(0, 0, 5);


        const render = () => {
            timeout = requestAnimationFrame(render);
            renderer.render(scene, camera);
            gl.endFrameEXP();
        };
        render();
    };

    
    if (!camera || !scene.children.length) return null;

    return (
        <GLView
            onTouchStart={ onPress }
            { ...panResponder.panHandlers }
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