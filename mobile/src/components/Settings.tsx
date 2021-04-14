import React, { ReactElement, useContext } from 'react';
import { Center } from 'native-base';
import { StyleSheet } from 'react-native';
import PouchDbContext from '../data/pouchdb/pouch-context';
import ConnectPouchForm from './ConnectPouchForm';
import DisconectPouchForm from './DisconnectPouchForm';


const Settings = (): ReactElement => {
    
    const { connect, isDbConnected, disconnect, dbName } = useContext(PouchDbContext);


    const disconnectHandler = () => {
        disconnect();
    };

    const connectHandler = (dbName: string, remoteUser: string, remotePassword: string) => {

        connect(dbName, remoteUser, remotePassword);
    };


    return (
        <Center style={ styles.container }>
                {isDbConnected() ?
                <DisconectPouchForm
                    dbName={ dbName } disconnectHandler={ disconnectHandler } />:
                <ConnectPouchForm dbSetupHandler={ connectHandler } /> }
        </Center>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 50,
    }
});


export default Settings;