import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { Position } from 'geojson';
import { Document } from 'idai-field-core';
import React, { useCallback, useContext, useEffect, useRef } from 'react';
import {
    GestureResponderEvent, LayoutRectangle, PanResponder, PanResponderGestureState, StyleSheet
} from 'react-native';
import { Matrix4 } from 'react-native-redash';
import { OrthographicCamera, Raycaster, Scene, Vector2 } from 'three';
import { ConfigurationContext } from '../../../../contexts/configuration-context';
import { UpdatedDocument } from '../../../../hooks/use-mapdata';
import usePrevious from '../../../../hooks/use-previous';
import { colors } from '../../../../utils/colors';
import { LONG_PRESS_DURATION_MS } from './constants';
import { processTransform2d, Transformation, WORLD_CS_HEIGHT, WORLD_CS_WIDTH } from './cs-transform';
import {
    addDocumentToScene,
    addHighlightedDocToScene,
    addlocationPointToScene, ObjectChildValues, removeDocumentFromScene, updateDocumentInScene
} from './geojson/geojson-gl-shape';
import { calcCenter, calcDistance } from './math-utils';


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
    screen: LayoutRectangle;
    viewBox: Transformation | undefined;
    documentToWorldMatrix: Matrix4 ;
    screenToWorldMatrix: Matrix4;
    selectedDocumentIds: string[];
    geoDocuments: Document[];
    location: {x: number, y:number} | undefined;
    updateDoc?: UpdatedDocument;
    selectParentId: (docId: string) => void
}


const GLMap: React.FC<GLMapProps> = ({
    setHighlightedDocId,
    screen,
    viewBox,
    documentToWorldMatrix,
    screenToWorldMatrix,
    selectedDocumentIds,
    geoDocuments,
    location,
    updateDoc,
    selectParentId,
}) => {

    const previousSelectedDocIds = usePrevious(selectedDocumentIds);
    const config = useContext(ConfigurationContext);

    const camera = useRef<OrthographicCamera>(new OrthographicCamera(0,WORLD_CS_WIDTH,WORLD_CS_HEIGHT,0) ).current;
    const scene = useRef<Scene>(new Scene() ).current;
    const renderer = useRef<Renderer>();
    const glContext = useRef<ExpoWebGLRenderingContext>();
    const glContextToScreenFactor = useRef<number>(0);

    //boolean to init gestures
    const isZooming = useRef<boolean>(false);
    const isMoving = useRef<boolean>(false);

    //long press handler variables
    const pressStartTime = useRef<number>(0);
    const pressedDocId = useRef<string>();

    //reference values set at the beginning of the gesture
    const initialTouch = useRef<{x: number, y: number}>({ x:0, y:0 });
    const initialZoom = useRef<number>(1);
    const initialDistance = useRef<number>(0);
    const zoom = useRef<number>(1);

    const left = useRef<number>(0);
    const initialLeft = useRef<number>(0);
    const top = useRef<number>(0);
    const initialTop = useRef<number>(0);
   
    const renderScene = useCallback(() => {

        scene.position.set(
            left.current + zoom.current,
            top.current + zoom.current,0);
        scene.scale.set(zoom.current, zoom.current,1);
        if(glContext && glContext.current && renderer && renderer.current){
            renderer.current.render(scene, camera);
            glContext.current.endFrameEXP();
        }
    },[camera, scene]);

    const screenToWorld = (point: Position) => processTransform2d(screenToWorldMatrix, point);

    const screenToNormalizedDeviceCoordinates = (x: number, y: number) =>
        new Vector2(
            (x / screen.width ) * 2 - 1,
            -(y / screen.height) * 2 + 1);

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
            pressStartTime.current = performance.now();
            const { nativeEvent: { touches } } = e;
            if(touches.length === 1){
                const [{ locationX, locationY }] = touches;
                touchHandler(locationX, locationY);
            } else if(touches.length === 2) {
                const [touch1, touch2] = touches;
                zoomHandler(touch1.locationX, touch1.locationY, touch2.locationX, touch2.locationY);
            } else return;
            e.preventDefault();
        },
        onPanResponderRelease: () => {
            isMoving.current = false;
            isZooming.current = false;
        }
    })).current;

    const touchHandler = (x: number, y: number): void => {

        const [x_w, y_w] = screenToWorld([x,y]);
        if(!isMoving.current || isZooming.current){
            isMoving.current = true;
            isZooming.current = false;
            initialLeft.current = left.current;
            initialTop.current = top.current;
            initialTouch.current = { x:x_w, y:y_w };
        } else {
            const dx = x_w - initialTouch.current.x;
            const dy = y_w - initialTouch.current.y;

            left.current = initialLeft.current + dx;
            top.current = initialTop.current + dy;
            renderScene();
        }
    };

    const zoomHandler = (x1: number, y1: number, x2: number, y2: number ): void => {
        
        const [x1_w, y1_w] = screenToWorld([x1,y1]);
        const [x2_w, y2_w] = screenToWorld([x2,y2]);
        const distance = calcDistance(x1_w, y1_w, x2_w, y2_w);
        const { x, y } = calcCenter(x1_w , y1_w, x2_w , y2_w);

        if(!isZooming.current){
            isZooming.current = true;
            initialTouch.current = { x,y };
            initialTop.current = top.current;
            initialLeft.current = left.current;
            initialZoom.current = zoom.current;
            initialDistance.current = distance;
        } else {
            const touchZoom = distance / initialDistance.current;
            const dx = x - initialTouch.current.x;
            const dy = y - initialTouch.current.y;
            left.current = (initialLeft.current + dx - x) * touchZoom + x;
            top.current = (initialTop.current + dy - y) * touchZoom + y;
            zoom.current = initialZoom.current * touchZoom;
            renderScene();
        }
    };

    useEffect(() => {

        if(!viewBox) return;
        const { scaleX, translateX, translateY } = viewBox;
        if(!isNaN(translateX)) left.current = translateX;
        if(!isNaN(translateY)) top.current = translateY;
        if(!isNaN(scaleX)) zoom.current = scaleX;
        renderScene();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[viewBox]);

    
    useEffect(() => {
    
        if(!geoDocuments.length) return;

        scene.clear();
        geoDocuments.forEach(doc => addDocumentToScene(doc,documentToWorldMatrix, scene, config));
        renderScene();
    },[geoDocuments, config ,scene, documentToWorldMatrix, renderScene]);


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
   
    useEffect(() => {
        
        if(!location) return;
        addlocationPointToScene(documentToWorldMatrix,scene,[location.x, location.y]);
        renderScene();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[location, scene, documentToWorldMatrix]);

    useEffect(() => {
        if(renderer.current && glContextToScreenFactor.current){
            renderer.current.setSize(
                screen.width * glContextToScreenFactor.current,
                screen.height * glContextToScreenFactor.current);
        
            renderScene();
        }
    },[screen, renderScene]);

    useEffect(() => {
        if(!updateDoc) return;
        
        const { document, status } = updateDoc;
        if(status === 'deleted')
            removeDocumentFromScene(document.resource.id, scene);
        else
            updateDocumentInScene(document, documentToWorldMatrix, scene, config);
        
        renderScene();

    },[updateDoc, scene, documentToWorldMatrix, config, renderScene]);
    

    const onPress = (e: GestureResponderEvent) => {

        const ndc_vec = screenToNormalizedDeviceCoordinates(e.nativeEvent.locationX, e.nativeEvent.locationY);
        const raycaster = new Raycaster();
        raycaster.setFromCamera(ndc_vec, camera);
        const intersections = raycaster.intersectObjects(scene.children,true);
        pressStartTime.current = performance.now();
        // filter objects to be selected and sort by renderOrder in descending order
        const filteredSortedInters = intersections
            .filter(intersection => intersection.object.parent?.userData['isSelected'])
            .sort((a,b) => {
                const aOrder = a.object.renderOrder;
                const bOrder = b.object.renderOrder;
                return (aOrder < bOrder) ? 1 : (aOrder > bOrder) ? -1 : 0;
            });
        if(filteredSortedInters.length){
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const docId = filteredSortedInters[0].object.parent!.uuid;
            setHighlightedDocId(docId);
            addHighlightedDocToScene(docId, scene);
            pressedDocId.current = docId;
            renderScene();
        }
    };

    const onTouchEnd = () => {

        if( performance.now() - pressStartTime.current > LONG_PRESS_DURATION_MS && pressedDocId.current)
            selectParentId(pressedDocId.current);
    };
    
    const onContextCreate = async(gl: ExpoWebGLRenderingContext) => {

        const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
        glContext.current = gl;
        renderer.current = new Renderer({ gl: glContext.current });
        glContextToScreenFactor.current = width / screen.width;
        renderer.current.setSize(width, height);
        renderer.current.setClearColor(colors.containerBackground);

        camera.position.set(cameraDefaultPos.x,cameraDefaultPos.y,cameraDefaultPos.z);

        renderScene();
    };

    
    if (!camera || !scene.children.length) return null;

    return (
        <GLView
            onTouchStart={ onPress }
            onTouchEnd={ onTouchEnd }
            { ...panResponder.panHandlers }
            style={ styles.container }
            onContextCreate={ onContextCreate }
        />
    );
};


const shouldRespond = (e: GestureResponderEvent, gestureState: PanResponderGestureState):boolean =>
        e.nativeEvent.touches.length === 2 ||
        Math.pow(gestureState.dx,2) + Math.pow(gestureState.dy,2) >= moveThreshold;


const styles = StyleSheet.create({
    container: {
        flex: 1
    }
});


export default GLMap;
