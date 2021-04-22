import { AppBar } from 'native-base';
import React, { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { headerBackgroundColor } from '../constants/colors';

interface AppHeaderProps {
    left?: ReactNode;
    middle?: ReactNode;
    right?: ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ left, middle, right }) => {
    return (
        <AppBar style={ styles.container } mt={ 0 }>
            <AppBar.Left>
                {left}
            </AppBar.Left>
            <AppBar.Content style={ styles.content }>
                {middle}
            </AppBar.Content>
            <AppBar.Right>
                {right}
            </AppBar.Right>
        </AppBar>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: headerBackgroundColor,
    },
    content: {
        padding: 5,
    }
});

export default AppHeader;
