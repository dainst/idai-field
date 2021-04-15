import { Center, View } from 'native-base';
import React, { ReactElement, useContext } from 'react';
import { StyleSheet } from 'react-native';
import AppHeader from '../components/AppHeader';
import Map from '../components/Map/Map';
import Settings from '../components/Settings';
import PouchDbContext from '../data/pouchdb/pouch-context';


const HomeScreen= (): ReactElement => {
    
    const { dbName, isDbConnected, operations } = useContext(PouchDbContext);

    return (
        <View style={ styles.container }>
            <AppHeader title={ isDbConnected()? dbName : 'iDAI field mobile' } />
            <Center flex={ 1 } >
                {isDbConnected() ?
                    <Map documents={ operations } />:
                    <Settings />
                }
            </Center>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});


export default HomeScreen;
