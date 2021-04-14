import React, { useContext, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { Center, View } from 'native-base';
import PouchDbContext from '../data/pouchdb/pouch-context';
import Settings from '../components/Settings';
import AppHeader from '../components/AppHeader';
import Map from '../components/Map';


const HomeScreen= (): ReactElement => {
    
    const { dbName, isDbConnected, operations } = useContext(PouchDbContext);

    return (
        <Center >
            <AppHeader
                title={ isDbConnected()? dbName : 'iDAI field mobile' }
            />
            <View contentContainerStyle={ styles.container }>
                {isDbConnected() ?
                    <Map documents={ operations } />:
                    <Settings />
                }
            </View>
        </Center>
    );
};


const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    }
});


export default HomeScreen;
