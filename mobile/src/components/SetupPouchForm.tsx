import React, { useState } from 'react';
import { Button, Form, Input, Item, Text } from 'native-base';
import { Keyboard } from 'react-native';

interface SetupPouchFormProps {
    dbSetupHandler: (dbName: string, remoteUser: string, remotePassword: string) => void;
}

const SetupPouchForm: React.FC<SetupPouchFormProps> = ({ dbSetupHandler }) => {

    const [remoteUser, setRemoteUser] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [dbName, setDbName] = useState<string>('');

    const connectionHandler = () => {
        setRemoteUser('');
        setPassword('');
        setDbName('');
        Keyboard.dismiss();
        dbSetupHandler(dbName, remoteUser, password);
    };
    
    return (
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
            <Item style={ { justifyContent: 'center', margin: 20 } } underline={ false }>
                <Button info onPress={ connectionHandler } style={ { width: '80%', justifyContent: 'center' } }>
                    <Text>Connect</Text>
                </Button>
            </Item>
        </Form>
    );
};


export default SetupPouchForm;