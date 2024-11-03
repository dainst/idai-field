import React, { ReactElement, ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';


interface ColumnProps {
    style?: StyleProp<ViewStyle>;
    children: ReactNode;
}


const Column = ({ children, style }: ColumnProps): ReactElement => {

    return <View style={ [styles.column, style] }>
        { children }
    </View>;
};

export default Column;

type FlexDirection = 'column';

const styles = {
    column: {
        flexDirection: 'column' as FlexDirection
    }
};
