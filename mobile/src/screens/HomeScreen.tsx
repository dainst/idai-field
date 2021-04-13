//import liraries
import React, { useContext, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { Container, Content, } from 'native-base';
import PouchDbContext from '../data/pouchdb/pouch-context';
import Settings from '../components/Settings';
import AppHeader from '../components/AppHeader';
import Map from '../components/Map';


const HomeScreen= (): ReactElement => {
    
    const { dbName, isDbConnected, operations } = useContext(PouchDbContext);

    return (
        <Container >
            <AppHeader
                title={ isDbConnected()? dbName : 'iDAI field mobile' }
            />
            <Content contentContainerStyle={ styles.container }>
                {isDbConnected() ?
                    <Map documents={ operations } />:
                    <Settings />
                }
            </Content>
        </Container>
    );
};


const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },

    red: {
        color: 'red',
    },
    green: {
        color: 'green',
    },
});


export default HomeScreen;
