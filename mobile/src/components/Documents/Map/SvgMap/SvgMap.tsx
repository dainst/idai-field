/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef } from 'react';
import {
    Animated, GestureResponderEvent, LayoutChangeEvent, PanResponder, PanResponderGestureState
} from 'react-native';
import Svg, { G, SvgProps } from 'react-native-svg';
import { getViewPortTransform } from '../viewbox-utils/viewbox-utils';
import { calcCenter, calcDistance } from './math-utils';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const no = () => {};
const yes = () => true;

interface Coordinate {
    x: number;
    y: number;
}


const SvgMap: React.FC<SvgProps> = ( props ) => {

    //absolute positions
    const left = useRef<Animated.Value>(new Animated.Value(0)).current;
    const top = useRef<Animated.Value>(new Animated.Value(0)).current;
    const zoom = useRef<Animated.Value>(new Animated.Value(1)).current;


    //viewbox transform only set at beginning
    const translateX = useRef<Animated.Value>(new Animated.Value(0)).current;
    const translateY = useRef<Animated.Value>(new Animated.Value(0)).current;
    const scaleX = useRef<Animated.Value>(new Animated.Value(0)).current;
    const scaleY = useRef<Animated.Value>(new Animated.Value(0)).current;


    //boolean to init gestures
    const isZooming = useRef<boolean>(false);
    const isMoving = useRef<boolean>(false);

    //reference values set at the beginning of the gesture
    const initialTouch = useRef<Coordinate>({ x:0, y:0 });
    const initialLeft = useRef<number>(0);
    const initialTop = useRef<number>(0);
    const initialZoom = useRef<number>(0);
    const initialDistance = useRef<number>(0);

    const moveThreshold = 5;
    const AG = Animated.createAnimatedComponent(G);
    const AnimatedSvg = Animated.createAnimatedComponent(Svg);

    
    const handleLayoutChange = (event: LayoutChangeEvent) => {
        
        const { x, y, width, height } = event.nativeEvent.layout;
        const transforms = getViewPortTransform(props.viewBox, props.preserveAspectRatio, { x, y, width, height });
        translateX.setValue(transforms.translateX);
        translateY.setValue(transforms.translateY);
        scaleY.setValue(transforms.scaleY);
        scaleX.setValue(transforms.scaleX);
    };
   
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
            initialLeft.current = (left as any)._value;
            initialTop.current = (top as any)._value;
            initialTouch.current = { x, y };
        } else {
            const dx = Animated.subtract(x,initialTouch.current.x);
            const dy = Animated.subtract(y,initialTouch.current.y);

            left.setValue((Animated.add(initialLeft.current, dx) as any).__getValue());
            top.setValue((Animated.add(initialTop.current, dy) as any).__getValue());
        }
    };

    const zoomHandler = (x1: number, y1: number, x2: number, y2: number ): void => {
        const distance = calcDistance(x1, y1, x2, y2);
        const { x, y } = calcCenter(x1, y1, x2, y2);

        if(!isZooming.current){
            isZooming.current = true;
            initialTouch.current = { x,y };
            initialTop.current = (top as any)._value;
            initialLeft.current = (left as any)._value;
            initialZoom.current = (zoom as any)._value;
            initialDistance.current = distance;
        } else {
            const touchZoom = distance / initialDistance.current;
            const dx = x - initialTouch.current.x;
            const dy = y - initialTouch.current.y;

            left.setValue( (initialLeft.current + dx - x) * touchZoom + x);
            top.setValue ( (initialTop.current + dy - y) * touchZoom + y);
            zoom.setValue ( initialZoom.current * touchZoom);
        }
    };

    
    return (
        <Animated.View style={ props.style } { ...panResponder.panHandlers } onLayout={ handleLayoutChange }>
            <AnimatedSvg>
            <AG
                x={ Animated.add(left, Animated.multiply(zoom, translateX)) }
                y={ Animated.add(top, Animated.multiply(zoom, translateY)) }
                scale={ Animated.multiply(scaleX, zoom) }>
                    {props.children}
                </AG>
            </AnimatedSvg>
        </Animated.View>
    );
};


export default SvgMap;