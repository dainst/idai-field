import React, { useRef, useState } from 'react';
import { Animated, Dimensions, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import {
    HandlerStateChangeEvent,
    PanGestureHandler,
    PanGestureHandlerEventPayload,
    State
} from 'react-native-gesture-handler';
//taken from https://snack.expo.io/@adamgrzybowski/react-native-gesture-handler-demo

interface BottomSheetProps {
    snapPointsFromTop: number[]
}

const USE_NATIVE_DRIVER = true;
const HEADER_HEIGHT = 10;


const BottomSheet: React.FC<BottomSheetProps> = (props) => {

    const [windowHeight, setWindowHeight] = useState<number>(Dimensions.get('window').height);
    const SNAP_POINTS_FROM_TOP = props.snapPointsFromTop.map(value => value * windowHeight);
    const START = SNAP_POINTS_FROM_TOP[0];
    const END = SNAP_POINTS_FROM_TOP[SNAP_POINTS_FROM_TOP.length - 1];

    const masterdrawer = useRef();
    const drawer = useRef();
    const drawerheader = useRef();
    const scroll = useRef();

    const [lastSnap, setLastSnap] = useState<number>(END);

    let lastScrollYValue = 0;
    const lastScrollY = useRef(new Animated.Value(0)).current;
    lastScrollY.addListener(({ value }) => {
        lastScrollYValue = value;
    });

    const dragY = useRef(new Animated.Value(9)).current;
    const _onGestureEvent = Animated.event(
        [{ nativeEvent: { translationY: dragY } }],
        { useNativeDriver: USE_NATIVE_DRIVER }
    );
    const reverseLastScrollY = Animated.multiply(
        new Animated.Value(-1),
        lastScrollY
    );

    const translateYOffset = useRef(new Animated.Value(END)).current;
    const translateY = Animated.add(
        translateYOffset,
        Animated.add(dragY, reverseLastScrollY)).interpolate({
            inputRange: [START, END],
            outputRange: [START, END],
            extrapolate: 'clamp', });


    const _onHandlerStateChange = ({ nativeEvent }: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
        
        if (nativeEvent.oldState === State.ACTIVE) {
            let { translationY } = nativeEvent;
            const { velocityY } = nativeEvent;
            translationY -= lastScrollYValue;
            const dragToss = 0.05;
            const endOffsetY =
            lastSnap + translationY + dragToss * velocityY;
    
            let destSnapPoint = SNAP_POINTS_FROM_TOP[0];
            for (let i = 0; i < SNAP_POINTS_FROM_TOP.length; i++) {
                const snapPoint = SNAP_POINTS_FROM_TOP[i];
                const distFromSnap = Math.abs(snapPoint - endOffsetY);
                if (distFromSnap < Math.abs(destSnapPoint - endOffsetY)) {
                    destSnapPoint = snapPoint;
                }
            }
            setLastSnap(destSnapPoint);
            translateYOffset.extractOffset();
            translateYOffset.setValue(translationY);
            translateYOffset.flattenOffset();
            dragY.setValue(0);
            Animated.spring(translateYOffset, {
            velocity: velocityY,
            tension: 68,
            friction: 12,
            toValue: destSnapPoint,
            useNativeDriver: USE_NATIVE_DRIVER,
            }).start();
        }
    };
    
    const _onHeaderHandlerStateChange = ({ nativeEvent }: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {

        if (nativeEvent.oldState === State.BEGAN) {
            lastScrollY.setValue(0);
        }
        _onHandlerStateChange({ nativeEvent });
    };
    

    const handleLayoutChange = (_event: LayoutChangeEvent) => setWindowHeight( Dimensions.get('window').height);


    return (
        <View
            style={ [styles.container, StyleSheet.absoluteFillObject ] }
            pointerEvents="box-none"
            onLayout={ handleLayoutChange }>
            <Animated.View
                style={ [
                    StyleSheet.absoluteFillObject,
                    { transform: [{ translateY }] }] }>
                <PanGestureHandler
                    ref={ drawerheader }
                    simultaneousHandlers={ [scroll, masterdrawer] }
                    shouldCancelWhenOutside={ false }
                    onGestureEvent={ _onGestureEvent }
                    onHandlerStateChange={ _onHeaderHandlerStateChange }>
                    <Animated.View style={ styles.header } >
                        <Animated.View style={ styles.icon } />
                    </Animated.View>
                </PanGestureHandler>
                <PanGestureHandler
                    ref={ drawer }
                    simultaneousHandlers={ [scroll, masterdrawer] }
                    shouldCancelWhenOutside={ false }
                    onGestureEvent={ _onGestureEvent }
                    onHandlerStateChange={ _onHandlerStateChange }>
                    <Animated.View style={ styles.mainContent }>
                        {props.children}
                    </Animated.View>
                </PanGestureHandler>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        elevation: 15,
        shadowColor: 'black',
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    mainContent: {
        flex: 1,
    },
    header: {
        height: HEADER_HEIGHT,
        backgroundColor: 'white',
        alignItems: 'center',
    },
    icon: {
        backgroundColor: '#ccc',
        width: 35,
        height: 6,
        borderRadius: 5
    }
  });

export default BottomSheet;