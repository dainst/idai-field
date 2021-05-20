import React, { ReactElement, ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';


interface HeadingProps {
    style?: StyleProp<ViewStyle>;
    children: ReactNode;
}


const Heading = ({ children, style }: HeadingProps): ReactElement => {

    return <Text
        style={ [styles.heading, style] }
        numberOfLines={ 1 }
        ellipsizeMode="tail"
    >
        { children }
    </Text>;
};

export default Heading;

const styles = StyleSheet.create({
    heading: {
        fontWeight: '600',
        fontSize: 18
    }
});
