import React, { useState } from 'react';
import {
    Animated, Dimensions
} from 'react-native';
import Svg, { G, SvgProps } from 'react-native-svg';
import { getViewPortTransform } from './viewbox-utils';


const NSvgMap: React.FC<SvgProps> = ( props ) => {

    //absolute positions
    const [left, setLeft] = useState<number>(0);
    const [top, setTop] = useState<number>(0);
    const [zoom, setZoom] = useState<number>(1);

    //viewbox transform only set at beginning
    const [translateX, setTranslateX] = useState<number>(0);
    const [translateY, setTranslateY] = useState<number>(0);
    const [scaleX, setScaleX] = useState<number>(1);
    const [scaleY, setScaleY] = useState<number>(1);

    //boolean to init gestures
    const [isZooming, setIsZooming] = useState<boolean>(true);
    const [isMoving, setIsMoving] = useState<boolean>(false);

    //reference values set at the beginning of the gesture
    const [initialX, setInitialX] = useState<number>(0);
    const [initialY, setInitialY] = useState<number>(0);
    const [initialDistance, setInitialDistance] = useState<number>(1);

    const { width, height } = Dimensions.get('screen');

    useState(()=> {
        const transforms = getViewPortTransform(props.viewBox, props.preserveAspectRatio, width, height);
        setTranslateX(transforms.translateX);
        setTranslateY(transforms.translateY);
        setScaleX(transforms.scaleX);
        setScaleY(transforms.scaleY);
    });

    return (
        <Animated.View style={ props.style }>
            <Svg height={ height } width={ width }>
                <G { ...getZoomTransform(left, top, zoom, scaleX, scaleY, translateX, translateY) }>
                    {props.children}
                </G>
            </Svg>
        </Animated.View>
    );
};


const getZoomTransform = (left: number,top: number,zoom: number,scaleX: number,scaleY:
                        number,translateX: number,translateY: number) => {
        return {
            translateX: left + zoom * translateX,
            translateY: top + zoom * translateY,
            scaleX: zoom * scaleX,
            scaleY: zoom * scaleY,
        };
};

export default NSvgMap;