import React, { ReactElement, useContext } from 'react';
import { Container, Content, Toast } from 'native-base';
import { StyleSheet } from 'react-native';
import PouchDbContext from '../data/pouchdb/pouch-context';
import ConnectPouchForm from '../components/ConnectPouchForm';
import DisconectPouchForm from '../components/DisconnectPouchForm';
import { RootStackNavProps } from '../navigation/RootStackNavigator/RootStackParamList';


const SettingsScreen = ({ navigation }: RootStackNavProps<'Settings'>): ReactElement => {
    
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

    const connectHandler = async (dbName: string, remoteUser: string, remotePassword: string) => {

        const status = await connect(dbName, remoteUser, remotePassword);
        if( status?.status === 200)
            navigation.reset({
                index: 1,
                routes: [
                    { name: 'Home' }
                ]
            });

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


export default SettingsScreen;