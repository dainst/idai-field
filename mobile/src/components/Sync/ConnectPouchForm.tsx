import { Button, Center, Input, Stack, Text, View } from 'native-base';
import React, { useState } from 'react';
import { Keyboard, StyleSheet } from 'react-native';
import { SyncSettings } from '../../model/settings';

interface ConnectPouchFormProps {
    settings: SyncSettings,
    onConnect: (settings: SyncSettings) => void;
}

const ConnectPouchForm: React.FC<ConnectPouchFormProps> = ({ settings, onConnect }) => {

    const [url, setUrl] = useState<string>(settings.url);
    const [password, setPassword] = useState<string>(settings.password);

    const onSubmit = () => {

        Keyboard.dismiss();
        onConnect({ url, password, connected: true });
    };

    return (
        <View>
            <Stack m={ 2 }>
                <Input placeholder="URL"
                    value={ url }
                    onChangeText={ setUrl }
                    autoCapitalize="none"
                    autoCorrect={ false }
                    m={ 1 }
                />
                <Input placeholder="Password"
                    type="password"
                    value={ password }
                    onChangeText={ setPassword }
                    autoCapitalize="none"
                    autoCorrect={ false }
                    m={ 1 }
                />
                <Center m={ 2 }>
                    <Button colorScheme="blue" onPress={ onSubmit } style={ styles.connectBtn }>
                        <Text color="white">Connect</Text>
                    </Button>
                </Center>
            </Stack>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        justifyContent: 'center'
    },
    connectBtnContainer: {
        justifyContent: 'center'
    },
    connectBtn: {
        width: '80%',
        justifyContent: 'center'
    }

});

export default ConnectPouchForm;
