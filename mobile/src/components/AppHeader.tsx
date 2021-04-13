import React, { ReactNode } from 'react';
import { Body, Header, Left, Right, Title } from 'native-base';
import { StyleSheet } from 'react-native';
import { headerBackgroundColor } from '../constants/colors';

interface AppHeaderProps {
    title: string;
    right?: ReactNode | null;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, right= null }) => {
    return (
        <Header style={ styles.container }>
            <Left />
            <Body>
                <Title style={ styles.header }>{title}</Title>
            </Body>
            <Right>
                {right}
            </Right>
        </Header>
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