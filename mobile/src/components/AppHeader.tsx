import React, { ReactNode } from 'react';
import { AppBar } from 'native-base';
import { StyleSheet } from 'react-native';
import { headerBackgroundColor } from '../constants/colors';

interface AppHeaderProps {
    title: string;
    right?: ReactNode | null;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, right= null }) => {
    return (
        <AppBar style={ styles.container }>
            <AppBar.Content>
                {title}
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
        width: '100%',
    },
    header: {
        color: 'white'
    }
});

export default AppHeader;