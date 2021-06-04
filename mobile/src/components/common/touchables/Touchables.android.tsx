import React, { ReactElement } from 'react';
import { TouchableOpacityProps } from 'react-native';
import {
    TouchableHighlight, TouchableOpacity as GHTouchableOpacity,
    TouchableWithoutFeedback
} from 'react-native-gesture-handler';


const TouchableOpacity = (props: TouchableOpacityProps): ReactElement => {

    return <GHTouchableOpacity { ... props } containerStyle={ props.style } style={ [] } />;
};

export {
    TouchableOpacity,
    TouchableHighlight,
    TouchableWithoutFeedback
};
