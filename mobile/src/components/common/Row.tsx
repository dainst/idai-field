import React, { ReactElement, ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';


interface RowProps {
    style?: StyleProp<ViewStyle>;
    children: ReactNode;
}


const Row = ({ children, style }: RowProps): ReactElement => {

    return <View style={ [styles.row, style] }>
        { children }
    </View>;
};

export default Row;

type FlexDirection = 'row';

const styles = {
    row: {
        flexDirection: 'row' as FlexDirection
    }
};
