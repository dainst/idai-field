import { Position } from 'geojson';
import { MutableRefObject, useRef } from 'react';
import { GestureResponderEvent, PanResponder, PanResponderGestureState, PanResponderInstance } from 'react-native';
import { Matrix4 } from 'react-native-redash';
import { processTransform2d } from './cs-transform';
import { calcCenter, calcDistance } from './math-utils';

const moveThreshold = 5;
// eslint-disable-next-line @typescript-eslint/no-empty-function
const no = () => {};
const yes = () => true;


const useMapGestureHandler = (
        top: MutableRefObject<number>,
        left: MutableRefObject<number> ,
        zoom: MutableRefObject<number>,
        pressStartTime: MutableRefObject<number>,
        screenToWorldMatrix: Matrix4,
        renderScene: () => void): PanResponderInstance => {

    //boolean to init gestures
    const isZooming = useRef<boolean>(false);
    const isMoving = useRef<boolean>(false);

    //reference values set at the beginning of the gesture
    const initialTouch = useRef<{x: number, y: number}>({ x:0, y:0 });
    const initialZoom = useRef<number>(1);
    const initialDistance = useRef<number>(0);

    const initialLeft = useRef<number>(0);
    const initialTop = useRef<number>(0);

    const screenToWorld = (point: Position) => processTransform2d(screenToWorldMatrix, point);

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
    

    return panResponder;
};

export default useMapGestureHandler;