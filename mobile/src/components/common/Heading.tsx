import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';


const Heading: React.FC<TextProps> = (props) => {

    return <Text
        style={ [styles.heading, props.style] }
        numberOfLines={ 1 }
        ellipsizeMode="tail"
        testID="headerText"
    >
        { props.children }
    </Text>;
};

export default Heading;

const styles = StyleSheet.create({
    heading: {
        fontWeight: '600',
        fontSize: 18
    }
});
