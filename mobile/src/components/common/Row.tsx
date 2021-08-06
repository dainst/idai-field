import React from 'react';
import { View, ViewProps } from 'react-native';


// interface RowProps extends ViewProps{
//     style?: StyleProp<ViewStyle>;
//     children: ReactNode;
// }


const Row: React.FC<ViewProps> = (props) => {

    return <View { ...props } style={ [styles.row, props.style] }>
        { props.children }
    </View>;
};

export default Row;

type FlexDirection = 'row';

const styles = {
    row: {
        flexDirection: 'row' as FlexDirection
    }
};
