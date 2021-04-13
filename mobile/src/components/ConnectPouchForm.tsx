import React, { useState } from 'react';
import { Button, Form, Input, Item, Text, Card, Body, CardItem } from 'native-base';
import { Keyboard, StyleSheet } from 'react-native';

interface ConnectPouchFormProps {
    dbSetupHandler: (dbName: string, remoteUser: string, remotePassword: string) => void;
}

const ConnectPouchForm: React.FC<ConnectPouchFormProps> = ({ dbSetupHandler }) => {

    const [remoteUser, setRemoteUser] = useState<string>('test467');
    const [password, setPassword] = useState<string>('Celt1!wedged');
    const [dbName, setDbName] = useState<string>('test467');

    const connectionHandler = () => {
        setRemoteUser('');
        setPassword('');
        setDbName('');
        Keyboard.dismiss();
        dbSetupHandler(dbName, remoteUser, password);
    };

    return (
        <Card>
            <CardItem header style={ styles.header }>
                <Text>Connect to project</Text>
            </CardItem>
            <Body>
                <Form>
                    <Item>
                        <Input placeholder="User"
                            value={ remoteUser }
                            onChange={ e => setRemoteUser(e.nativeEvent.text) }
                            autoCapitalize="none"
                            autoCorrect={ false }
                        />
                    </Item>
                    <Item>
                        <Input placeholder="Project"
                            value={ dbName }
                            onChange={ e => setDbName(e.nativeEvent.text) }
                            autoCapitalize="none"
                            autoCorrect={ false }
                        />
                    </Item>
                    <Item>
                        <Input placeholder="Password"
                            value={ password }
                            onChange={ e => setPassword(e.nativeEvent.text) }
                            autoCapitalize="none"
                            autoCorrect={ false }
                        />
                    </Item>
                    <Item style={ styles.connectBtnContainer } >
                        <Button info onPress={ connectionHandler } style={ styles.connectBtn }>
                            <Text>Connect</Text>
                        </Button>
                    </Item>
                </Form>
            </Body>
        </Card>
    );
};

const styles = StyleSheet.create({
    header: {
        justifyContent: 'center',
    },
    connectBtnContainer: {
        justifyContent: 'center',
        margin: 20,
    },
    connectBtn: {
        width: '80%',
        justifyContent: 'center'
    }

});

export default ConnectPouchForm;