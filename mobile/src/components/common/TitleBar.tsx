import React, { ReactElement, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Row from './Row';


interface TitleBarProps {
    left?: ReactNode;
    title: ReactNode;
    right?: ReactNode;
}


const TitleBar = ({ left, title, right }: TitleBarProps): ReactElement => {

    return <Row style={ styles.titleBar }>
        <View style={ { alignItems: 'flex-start' } }>
            { left }
        </View>
        <Row style={ styles.title }>{ title }</Row>
        <View style={ { alignItems: 'flex-end' } }>
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
        padding: 5,
    },
    title: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
});
