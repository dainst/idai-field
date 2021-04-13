import React, { ReactElement, useContext } from 'react';
import { Container, Content, Toast } from 'native-base';
import { StyleSheet } from 'react-native';
import PouchDbContext from '../data/pouchdb/pouch-context';
import ConnectPouchForm from './ConnectPouchForm';
import DisconectPouchForm from './DisconnectPouchForm';


const Settings = (): ReactElement => {
    
    const { connect, isDbConnected, disconnect, dbName } = useContext(PouchDbContext);


    const disconnectHandler = () => {
        disconnect();
        Toast.show({
            text: `Disconnected from ${dbName}`,
            buttonText: 'Okay',
            duration: 2000,
            position: 'top',
            textStyle: { color:  'green' },
        });
    };

    const connectHandler = (dbName: string, remoteUser: string, remotePassword: string) => {

        connect(dbName, remoteUser, remotePassword);
    };


    return (
        <Container style={ styles.container }>
            <Content>
                {isDbConnected() ?
                <DisconectPouchForm
                    dbName={ dbName } disconnectHandler={ disconnectHandler } />:
                <ConnectPouchForm dbSetupHandler={ connectHandler } /> }
            </Content>
        </Container>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 50,
    }
});


export default Settings;