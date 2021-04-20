import { AppBar, Text } from 'native-base';
import React, { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { headerBackgroundColor } from '../constants/colors';

interface AppHeaderProps {
    title: string;
    right?: ReactNode | null;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, right = null }) => {
    return (
        <AppBar style={ styles.container } mt={ 0 }>
            <AppBar.Left></AppBar.Left>
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
