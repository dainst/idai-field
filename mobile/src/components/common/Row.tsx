import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';


const Row: React.FC<ViewProps> = (props) => {

    return <View { ...props } style={ [styles.row, props.style] }>
        { props.children }
    </View>;
};

export default Row;


const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center'
    }
});
