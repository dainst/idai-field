import { View } from 'native-base';
import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Svg, { G, SvgProps } from 'react-native-svg';
import ZoomableSvg from 'zoomable-svg';
import { viewBox } from '../Map/constants';


const SvgMap: React.FC<SvgProps> = ( props ) => {

    const { width, height } = Dimensions.get('screen');

    return (
        <View style={ styles.container }>
            <ZoomableSvg
                align="mid"
                vbWidth={ viewBox[2] }
                vbHeight={ viewBox[3] }
                width={ width }
                height={ height }
                initialZoom={ 1.0 }
                svgRoot={ ({ transform }) => (
                    <Svg width={ width } height={ height }>
                        <G transform={ transform }>
                            {props.children}
                        </G>
                    </Svg>
                ) }
            />
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});


export default SvgMap;
