import Color from 'color';
import React, { ReactElement, ReactNode } from 'react';
import {
    NativeSyntheticEvent, NativeTouchEvent, StyleProp, StyleSheet, Text, TextStyle,
    TouchableOpacity, View, ViewStyle
} from 'react-native';
import { colors, textColors } from '../../utils/colors';


type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'transparent';


interface ButtonProps {
    style?: StyleProp<ViewStyle>;
    title?: string;
    icon?: ReactNode;
    variant?: ButtonVariant;
    isDisabled?: boolean;
    testID?: string;
    onPress: (e: NativeSyntheticEvent<NativeTouchEvent>) => void;
}


const Button = ({
    style,
    title,
    icon,
    variant = 'secondary',
    isDisabled = false,
    testID,
    onPress,
}: ButtonProps): ReactElement => {

    return <TouchableOpacity
            onPress={ onPress }
            style={ [getButtonStyle(variant), style, isDisabled && getDisabledStyle(variant)] }
            activeOpacity={ .9 }
            testID={ testID }
        >
        <View style={ styles.container }>
            { icon && <Text style={ getTextStyle(variant) }>{ icon }</Text> }
            { icon && title && <Text style={ styles.separator } />}
            { title && <Text style={ getTextStyle(variant) }>{ title }</Text> }
        </View>
    </TouchableOpacity>;
};

export default Button;

const getButtonStyle = (variant: ButtonVariant): ViewStyle => ({
    backgroundColor: colors[variant],
    padding: 10,
    borderRadius: 5,
});

const getDisabledStyle = (variant: ButtonVariant): ViewStyle => ({
    backgroundColor: Color(colors[variant]).alpha(0.7).string()
});

const getTextStyle = (variant: ButtonVariant): TextStyle => ({
    color: textColors[variant],
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    separator: {
        width: 5,
    },
});
