import React, { ReactElement, ReactNode } from 'react';
import { NativeSyntheticEvent, NativeTouchEvent, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { TouchableHighlight } from 'react-native-gesture-handler';


type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'transparent';


interface ButtonProps {
    style?: StyleProp<ViewStyle>;
    title?: string;
    icon?: ReactNode;
    variant?: ButtonVariant;
    onPress: (e: NativeSyntheticEvent<NativeTouchEvent>) => void;
}


const Button = ({ style, title, icon, variant = 'secondary', onPress }: ButtonProps): ReactElement => {

    return <TouchableHighlight onPress={ onPress }>
        <View style={ [getButtonStyle(variant), style] }>
            { icon && <Text style={ getTextStyle(variant) }>{ icon }</Text> }
            { icon && title && <Text style={ styles.separator } />}
            { title && <Text style={ getTextStyle(variant) }>{ title }</Text> }
        </View>
    </TouchableHighlight>;
};

export default Button;

const getButtonStyle = (variant: ButtonVariant): ViewStyle => {

    const colors = {
        secondary: '#f9f9f9',
        primary: '#5572a1',
        success: '#32a852',
        danger: '#dc3545',
        transparent: 'transparent'
    };

    return {
        backgroundColor: colors[variant],
        alignItems: 'center',
        padding: 10,
        borderRadius: 5,
        flexDirection: 'row',
        justifyContent: 'center'
    };
};

const getTextStyle = (variant: ButtonVariant): TextStyle => {

    const colors = {
        secondary: 'black',
        primary: 'white',
        success: 'white',
        danger: 'white',
        transparent: 'black'
    };

    return {
        color: colors[variant]
    };
};

const styles = StyleSheet.create({
    separator: {
        width: 5
    }
});
