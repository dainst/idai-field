import React, { ReactElement, ReactNode } from 'react';
import { NativeSyntheticEvent, NativeTouchEvent, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { colors, textColors } from '../../utils/colors';


type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'transparent';


interface ButtonProps {
    style?: StyleProp<ViewStyle>;
    title?: string;
    icon?: ReactNode;
    variant?: ButtonVariant;
    isDisabled?: boolean;
    onPress: (e: NativeSyntheticEvent<NativeTouchEvent>) => void;
}


const Button = ({ style, title, icon, variant = 'secondary', onPress, isDisabled }: ButtonProps): ReactElement => {

    return <TouchableOpacity
            onPress={ onPress }
            style={ [getButtonStyle(variant), style, isDisabled && styles.disabledButton] }
            activeOpacity={ .9 }
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
    borderRadius: 5
});

const getTextStyle = (variant: ButtonVariant): TextStyle => ({
    color: textColors[variant]
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
    disabledButton: {
        opacity: .7
    }
});
