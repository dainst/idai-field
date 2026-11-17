import Color from 'color';
import React, { ReactElement, ReactNode } from 'react';
import {
    NativeSyntheticEvent, NativeTouchEvent, StyleProp, StyleSheet, Text, TextStyle,
    TouchableOpacity, View, ViewStyle
} from 'react-native';
import { colors, Colors, textColors } from '@/utils/colors';

type ButtonVariant = keyof Colors;


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
            disabled={ isDisabled }
        >
        <View style={ styles.container }>
            { icon && <Text style={ getTextStyle(variant,isDisabled) }>{ icon }</Text> }
            { icon && title && <Text style={ styles.separator } />}
            { title && <Text style={ getTextStyle(variant,isDisabled) }>{ title }</Text> }
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
    backgroundColor: Color(colors[variant]).alpha(0.5).string(),
});

const getTextStyle = (variant: ButtonVariant, disabled: boolean): TextStyle => ({
    color: disabled ? 'white' : textColors[variant],
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
