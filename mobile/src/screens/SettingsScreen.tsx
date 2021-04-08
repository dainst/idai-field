import React, { useContext, useEffect, useState } from 'react';
import { Button, Container, Content, Form, Input, Item, Text, Toast } from 'native-base';
import { StyleSheet, Keyboard } from 'react-native';
import PouchDbContext from '../data/pouchdb/pouch-context';


const SettingsScreen: React.FC = () => {
    const [remoteUser, setRemoteUser] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [dbName, setDbName] = useState<string>('');
    

    const pouchCtx = useContext(PouchDbContext);

    useEffect(() => {

        if(pouchCtx.status)
            Toast.show({
                text: pouchCtx.status.message,
                buttonText: 'Okay',
                duration: 2000,
                position: 'top',
                
                textStyle: { color: pouchCtx.status.status !== 200? 'red': 'green' },
            });
        
    },[pouchCtx, pouchCtx.status]);
    
    const connectHandler = () => {
        pouchCtx.setupDb(dbName,remoteUser,password);
        Keyboard.dismiss();
        setRemoteUser('');
        setPassword('');
        setDbName('');
    };


    return (
        <Container style={ styles.container }>
            <Content>
                <Form>
                    <Item>
                        <Input placeholder="User"
                            value={ remoteUser }
                            onChange={ (e) => setRemoteUser(e.nativeEvent.text) }
                            autoCapitalize="none" />
                    </Item>
                    <Item>
                        <Input placeholder="Project"
                            value={ dbName }
                            onChange={ (e) => setDbName(e.nativeEvent.text) }
                            autoCapitalize="none"
                        />
                    </Item>
                    <Item>
                        <Input placeholder="Password"
                        value={ password }
                        onChange={ e => setPassword(e.nativeEvent.text) }
                        autoCapitalize="none" />
                    </Item>
                    <Item style={ { justifyContent: 'center', margin: 20 } } underline={ false }>
                        <Button info onPress={ connectHandler } style={ { width: '80%', justifyContent: 'center' } }>
                            <Text>Connect</Text>
                        </Button>
                    </Item>
                </Form>
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