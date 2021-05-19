import React, { ReactElement, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Row from './Row';


interface TitleBarProps {
    left?: ReactNode;
    title: string;
    right?: ReactNode;
}


const TitleBar = ({ left, title, right }: TitleBarProps): ReactElement => {

    return <Row style={ styles.titleBar }>
        <View style={ { flex: 1, alignItems: 'flex-start' } }>
            { left }
        </View>
        <Text style={ styles.title }>{ title }</Text>
        <View style={ { flex: 1, alignItems: 'flex-end' } }>
            { right }
        </View>
    </Row>;
};

export default TitleBar;

const styles = StyleSheet.create({
    titleBar: {
        justifyContent: 'space-between',
        borderBottomColor: 'gray',
        borderBottomWidth: 1,
        padding: 5
    },
    title: {
        fontSize: 16,
        fontWeight: '500',
        padding: 10,
        flex: 1,
        textAlign: 'center'
    },
});
