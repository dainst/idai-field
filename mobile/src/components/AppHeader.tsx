import { AppBar, Text } from 'native-base';
import React, { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { headerBackgroundColor } from '../constants/colors';

interface AppHeaderProps {
    title: string;
    right?: ReactNode | null;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, right= null }) => {
    return (
        <AppBar style={ styles.container } >
            <AppBar.Left></AppBar.Left>
            <AppBar.Content>
                <Text color="white" fontWeight="bold">{title}</Text>
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
        minHeight:'5%'
    },
});

export default AppHeader;