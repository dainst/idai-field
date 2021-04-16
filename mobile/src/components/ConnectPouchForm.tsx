import { Button, Center, Input, Stack, Text } from 'native-base';
import React, { useState } from 'react';
import { Keyboard, StyleSheet } from 'react-native';

interface ConnectPouchFormProps {
    dbSetupHandler: (dbName: string, remoteUser: string, remotePassword: string) => void;
}

const ConnectPouchForm: React.FC<ConnectPouchFormProps> = ({ dbSetupHandler }) => {

    const [remoteUser, setRemoteUser] = useState<string>('test467');
    const [password, setPassword] = useState<string>('');
    const [dbName, setDbName] = useState<string>('test467');

    const connectionHandler = () => {
        setRemoteUser('');
        setPassword('');
        setDbName('');
        Keyboard.dismiss();
        dbSetupHandler(dbName, remoteUser, password);
    };

    return (
        <Center>
            <Text>Connect to project</Text>
            <Stack width={ 400 } m={ 2 }>
                <Input placeholder="User"
                    value={ remoteUser }
                    onChange={ e => setRemoteUser(e.nativeEvent.text) }
                    autoCapitalize="none"
                    autoCorrect={ false }
                    m={ 1 }
                />
                <Input placeholder="Project"
                    value={ dbName }
                    onChange={ e => setDbName(e.nativeEvent.text) }
                    autoCapitalize="none"
                    autoCorrect={ false }
                    m={ 1 }
                />
                <Input placeholder="Password"
                    value={ password }
                    onChange={ e => setPassword(e.nativeEvent.text) }
                    autoCapitalize="none"
                    autoCorrect={ false }
                    m={ 1 }
                />
                <Center m={ 2 }>
                    <Button info onPress={ connectionHandler } style={ styles.connectBtn }>
                        <Text>Connect</Text>
                    </Button>
                </Center>
        </Stack>
        </Center>
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
