import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { Container, Content, Toast } from 'native-base';
import { StyleSheet } from 'react-native';
import PouchDbContext from '../data/pouchdb/pouch-context';
import ConnectPouchForm from '../components/ConnectPouchForm';
import DisconectPouchForm from '../components/DisconnectPouchForm';
import { RootStackNavProps } from '../navigation/RootStackNavigator/RootStackParamList';


const SettingsScreen = ({ navigation }: RootStackNavProps<'Settings'>): ReactElement => {
    
    const pouchCtx = useContext(PouchDbContext);
    const [isDbConnected, setIsDbConnected] = useState(false);

    useEffect(() => {

        if(pouchCtx.status){
            Toast.show({
                text: pouchCtx.status.message,
                buttonText: 'Okay',
                duration: 2000,
                position: 'top',
                
                textStyle: { color: pouchCtx.status.status !== 200? 'red': 'green' },
            });

            if(pouchCtx.status.status === 200){
                setIsDbConnected(true);
                navigation.navigate('Home');
            }

        } else setIsDbConnected(false);
            
        
    },[pouchCtx, pouchCtx.status, navigation]);

    const disconnectHandler = () => {
        pouchCtx.disconnect();
        Toast.show({
            text: `Disconnected from ${pouchCtx.dbName}`,
            buttonText: 'Okay',
            duration: 2000,
            position: 'top',
            textStyle: { color:  'green' },
        });
    };


    return (
        <Container style={ styles.container }>
            <Content>
                {isDbConnected ?
                <DisconectPouchForm
                    dbName={ pouchCtx.dbName } disconnectHandler={ disconnectHandler } />:
                <SetupPouchForm dbSetupHandler={ pouchCtx.setupDb } /> }
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