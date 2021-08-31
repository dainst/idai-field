import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { Document, FieldGeometry } from 'idai-field-core';
import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { GestureResponderEvent, PanResponder, PanResponderGestureState, StyleSheet } from 'react-native';
import { Matrix4 } from 'react-native-redash';
import { OrthographicCamera, Raycaster, Scene, Vector2 } from 'three';
import { ConfigurationContext } from '../../../../contexts/configuration-context';
import { CameraView } from '../../../../hooks/use-mapdata';
import usePrevious from '../../../../hooks/use-previous';
import { colors } from '../../../../utils/colors';
import { ViewPort } from './geojson';
import {
    lineStringToShape, multiPointToShape, ObjectChildValues, ObjectData,
    pointToShape, polygonToShape
} from './geojson-gl-shape';
import { calcCenter, calcDistance } from './math-utils';


interface Coordinate2D {
    x: number;
    y: number;
}

interface CameraPosition extends Coordinate2D {
    z: number;
}

const cameraDefaultPos = {
    x: 0,
    y: 0,
    z: 5,
};


const moveThreshold = 5;
// eslint-disable-next-line @typescript-eslint/no-empty-function
const no = () => {};
const yes = () => true;


interface GLMapProps {
    setHighlightedDocId: (docId: string) => void;
    viewPort: ViewPort;
    cameraView: CameraView | undefined;
    transformMatrix: Matrix4 | undefined;
    selectedDocumentIds: string[];
    geoDocuments: Document[];
}


const GLMap: React.FC<GLMapProps> = ({
    setHighlightedDocId,
    viewPort,
    cameraView,
    transformMatrix,
    selectedDocumentIds,
    geoDocuments
}) => {

    const config = useContext(ConfigurationContext);

    const camera = useRef<OrthographicCamera>(new OrthographicCamera(0,0,100,100) ).current;
    const scene = useRef<Scene>(new Scene() ).current;
    const renderer = useRef<Renderer>();
    const glContext = useRef<ExpoWebGLRenderingContext>();

    const previousSelectedDocIds = usePrevious(selectedDocumentIds);


    //boolean to init gestures
    const isZooming = useRef<boolean>(false);
    const isMoving = useRef<boolean>(false);

    //reference values set at the beginning of the gesture
    const initialTouch = useRef<Coordinate2D>({ x:0, y:0 });
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


    const renderScene = useCallback(() => {
        if(glContext && glContext.current && renderer && renderer.current){
            renderer.current.render(scene, camera);
            glContext.current.endFrameEXP();
        }
    },[camera, scene]);

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
            updateCamera(camera.zoom,{
                x: initialX.current - dx / camera.zoom,
                y: initialY.current + dy / camera.zoom,
                z: cameraDefaultPos.z
            });
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
            updateCamera(newZoom);
        }
    };
    

    useEffect(() => {
        
        if(viewPort){
            scene.clear();
            const maxSize = Math.max(viewPort.width, viewPort.height );
            const view: CameraView = {
                left: viewPort.x,
                right: maxSize,
                top: maxSize,
                bottom: viewPort.y
            };
            updateCamera(1, cameraDefaultPos, view);
            
        }
        
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[viewPort]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => updateCamera(1, cameraDefaultPos, cameraView),[cameraView]);

    const updateCamera = (zoom: number, pos?: CameraPosition, view?: CameraView) => {
        
        camera.zoom = zoom;
        
        if(pos){
            camera.position.set(pos.x, pos.y, pos.z);
        }
        if(view ){
            camera.left = view.left;
            camera.right = view.right;
            camera.top = view.top;
            camera.bottom = view.bottom;
        }

        camera.updateProjectionMatrix();
        renderScene();
    };


    useEffect(() => {
    
        if(!transformMatrix || !geoDocuments.length) return;
        scene.clear();
        geoDocuments.forEach((doc) => {
            
            const geometry = doc.resource.geometry as FieldGeometry;
            
            switch(geometry.type){
                case 'Polygon':
                case 'MultiPolygon':
                    polygonToShape(transformMatrix, scene, config, doc, geometry.coordinates);
                    break;
                case 'LineString':
                case 'MultiLineString':
                    lineStringToShape(transformMatrix, scene, config, doc, geometry.coordinates);
                    break;
                case 'Point':
                    pointToShape(transformMatrix, scene, config, doc, geometry.coordinates);
                    break;
                case 'MultiPoint':
                    multiPointToShape(transformMatrix,scene, config, doc, geometry.coordinates);
                    break;
            }
        });
        renderScene();
    },[geoDocuments, config ,scene, transformMatrix, renderScene]);


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
        glContext.current = gl;
        renderer.current = new Renderer({ gl: glContext.current });

        renderer.current.setSize(width, height);
        renderer.current.setClearColor(colors.containerBackground);

        camera.position.set(cameraDefaultPos.x,cameraDefaultPos.y,cameraDefaultPos.z);

        renderScene();
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
