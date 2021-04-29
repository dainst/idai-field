/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from 'react';
import {
    Animated, Dimensions, GestureResponderEvent, PanResponder, PanResponderGestureState
} from 'react-native';
import Svg, { G, SvgProps } from 'react-native-svg';
import { calcCenter, calcDistance } from './math-utils';
import { getViewPortTransform } from './viewbox-utils';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const no = () => {};
const yes = () => true;


const NSvgMap: React.FC<SvgProps> = ( props ) => {

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
    const isZooming = useRef<Animated.Value>(new Animated.Value(0)).current;
    const isMoving = useRef<Animated.Value>(new Animated.Value(0)).current;

    //reference values set at the beginning of the gesture
    const initialX = useRef<Animated.Value>(new Animated.Value(0)).current;
    const initialY = useRef<Animated.Value>(new Animated.Value(0)).current;
    const initialLeft = useRef<Animated.Value>(new Animated.Value(0)).current;
    const initialTop = useRef<Animated.Value>(new Animated.Value(0)).current;
    const initialZoom = useRef<Animated.Value>(new Animated.Value(0)).current;
    const initialDistance = useRef<Animated.Value>(new Animated.Value(0)).current;


    const { width, height } = Dimensions.get('window');
    const moveThreshold = 5;
    const AG = Animated.createAnimatedComponent(G);
    const AnimatedSvg = Animated.createAnimatedComponent(Svg);

    useEffect(() => {
        const transforms = getViewPortTransform(props.viewBox, props.preserveAspectRatio, { x: 0, y:0, width, height });
        translateX.setValue(transforms.translateX);
        translateY.setValue(transforms.translateY);
        scaleY.setValue(transforms.scaleY);
        scaleX.setValue(transforms.scaleX);
    });
    
   
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
            isMoving.setValue(0);
            isZooming.setValue(0);
        }
    })).current;

    
    const touchHandler = (x: number, y: number): void => {

        if(!(isMoving as any)._value || (isZooming as any)._value){
            isMoving.setValue(1);
            isZooming.setValue(0);
            initialLeft.setValue((left as any)._value);
            initialTop.setValue((top as any)._value);
            initialX.setValue(x);
            initialY.setValue(y);
        } else {
            const dx = Animated.subtract(x,initialX);
            const dy = Animated.subtract(y,initialY);

            left.setValue((Animated.add(initialLeft, dx) as any).__getValue());
            top.setValue((Animated.add(initialTop, dy) as any).__getValue());
        }
    };

    const zoomHandler = (x1: number, y1: number, x2: number, y2: number ): void => {
        const distance = calcDistance(x1, y1, x2, y2);
        const { x, y } = calcCenter(x1, y1, x2, y2);

        if(!(isZooming as any)._value){
            isZooming.setValue(1);
            initialX.setValue(x);
            initialY.setValue(y);
            initialTop.setValue((top as any)._value);
            initialLeft.setValue((left as any)._value);
            initialZoom.setValue((zoom as any)._value);
            initialDistance.setValue(distance);
        } else {
            const touchZoom = distance / (initialDistance as any)._value;
            const dx = x - (initialX as any)._value;
            const dy = y - (initialY as any)._value;

            left.setValue( ((initialLeft as any)._value + dx - x) * touchZoom + x);
            top.setValue ( ((initialTop as any)._value + dy - y) * touchZoom + y);
            zoom.setValue ( (initialZoom as any)._value * touchZoom);
        }
    };

    
    return (
        <Animated.View style={ props.style } { ...panResponder.panHandlers } >
            <AnimatedSvg width={ width } height={ height } >
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


export default NSvgMap;