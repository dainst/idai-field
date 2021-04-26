import React, { useRef } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';
import {
    PanGestureHandler, PanGestureHandlerStateChangeEvent, PinchGestureHandler,
    PinchGestureHandlerStateChangeEvent, State
} from 'react-native-gesture-handler';
import Svg, { G, SvgProps } from 'react-native-svg';


const SvgMap: React.FC<SvgProps> = ( props ) => {

    // pan & translation
    const translateX = useRef<Animated.Value>(new Animated.Value(0)).current;
    const translateY = useRef<Animated.Value>(new Animated.Value(0)).current;
    const lastOffset = { x: 0, y: 0 };

    // scaling
    const baseScale = useRef<Animated.Value>(new Animated.Value(1)).current;
    const pinchScale = useRef<Animated.Value>(new Animated.Value(1)).current;
    const scale = Animated.multiply(baseScale, pinchScale);
    let lastScale = 1;

    const AG = Animated.createAnimatedComponent(G);
    const AnimatedSvg = Animated.createAnimatedComponent(Svg);
    const { width, height } = Dimensions.get('screen');

    // pan & translation events
    const onGestureEvent = Animated.event(
        [
          {
            nativeEvent: {
              translationX: translateX,
              translationY: translateY,
            },
          },
        ],
        { useNativeDriver: false }
    );
    

    const onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {

        if (event.nativeEvent.oldState === State.ACTIVE) {
            lastOffset.x += event.nativeEvent.translationX;
            lastOffset.y += event.nativeEvent.translationY;
            translateX.setOffset(lastOffset.x);
            translateX.setValue(0);
            translateY.setOffset(lastOffset.y);
            translateY.setValue(0);
        }
    };

    
    // pinch & scaling events
    const onPinchGestureEvent = Animated.event(
        [{ nativeEvent: { scale: pinchScale } }],
        { useNativeDriver: false }
    );


    const onPinchHandlerStateChange = (event: PinchGestureHandlerStateChangeEvent) => {
        
        if (event.nativeEvent.oldState === State.ACTIVE) {
            lastScale *= event.nativeEvent.scale;
            baseScale.setValue(lastScale);
            pinchScale.setValue(1);
        }
      };

    
    const animatedStyle = {
        transform: [
          {
            translateY: Animated.multiply(translateY, 100 / height)
          },
          {
            scale: scale
          },
          {
            translateX: Animated.multiply(translateX, 100 / width)
          }
        ]
    };


    return (
        <PanGestureHandler
            onGestureEvent={ onGestureEvent }
            onHandlerStateChange={ onHandlerStateChange }>
            <PinchGestureHandler
                onGestureEvent={ onPinchGestureEvent }
                onHandlerStateChange={ onPinchHandlerStateChange }>
                <Animated.View style={ styles.animatedViewStyle } >
                    <AnimatedSvg viewBox={ props.viewBox } >
                        <AG style={ animatedStyle } >
                            {props.children}
                        </AG>
                    </AnimatedSvg>
                </Animated.View>
            </PinchGestureHandler>
        </PanGestureHandler>);
};


const styles = StyleSheet.create({
    animatedViewStyle: {
        flex: 1
    }
});


export default SvgMap;
