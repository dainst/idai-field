import React from 'react';
import { Container, Text } from 'native-base';
import { StyleSheet } from 'react-native';


const SettingsScreen: React.FC = () => {
    return (
        <Container style={ styles.container }>
            <Text>Settings Screen</Text>
        </Container>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});


export default SettingsScreen;