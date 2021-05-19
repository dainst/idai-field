import React, { ReactElement, ReactNode } from 'react';
import { NativeSyntheticEvent, NativeTouchEvent, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { colors, textColors } from '../../utils/colors';


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

const getButtonStyle = (variant: ButtonVariant): ViewStyle => ({
    backgroundColor: colors[variant],
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'center'
});

const getTextStyle = (variant: ButtonVariant): TextStyle => ({
    color: textColors[variant]
});

const styles = StyleSheet.create({
    separator: {
        width: 5
    }
});
