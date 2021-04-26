import React, { useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet } from 'react-native';
import Svg, { G, SvgProps } from 'react-native-svg';


const SvgMap: React.FC<SvgProps> = ( props ) => {

    const pan = useRef<Animated.ValueXY>(new Animated.ValueXY()).current;
    const AG = Animated.createAnimatedComponent(G);
    const { width, height } = Dimensions.get('screen');

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: pan.x._value,
                    y: pan.y._value
                });
            },
            onPanResponderMove: (event, gesture) => {
                pan.x.setValue(gesture.dx * 100 / width);
                pan.y.setValue(gesture.dy * 100 / height);
            },
            onPanResponderRelease: () => {
                pan.flattenOffset();
            }
        })
    ).current;
    

    const animatedStyle = {
        transform: [
          {
            translateY: pan.y
          },
          {
            scaleX: 1
          },
          {
            scaleY: 1
          },
          {
            translateX: pan.x
          }
        ]
      };

    return (
        <Animated.View style={ styles.animatedViewStyle } { ...panResponder.panHandlers }>
            <Svg viewBox={ props.viewBox } >
                <AG style={ animatedStyle } >
                    {props.children}
                </AG>
            </Svg>
        </Animated.View>
    );
};


const styles = StyleSheet.create({
    animatedViewStyle: {
        flex: 1
    }
});


export default SvgMap;
