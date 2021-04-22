import { AppBar, Text } from 'native-base';
import React, { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { headerBackgroundColor } from '../constants/colors';

interface AppHeaderProps {
    left?: ReactNode;
    title: string;
    right?: ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ left, title, right }) => {
    return (
        <AppBar style={ styles.container } mt={ 0 }>
            <AppBar.Left>
                {left}
            </AppBar.Left>
            <AppBar.Content>
                <Text color="white" fontWeight="bold" fontSize="lg">{title}</Text>
            </AppBar.Content>
            <AppBar.Right>
                {right}
            </AppBar.Right>
        </AppBar>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: headerBackgroundColor
    },
});

export default AppHeader;
