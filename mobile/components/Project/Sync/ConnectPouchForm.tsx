import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Keyboard } from 'react-native';
import { ProjectSettings } from '@/models/preferences';
import Button from '@/components/common/Button';
import Column from '@/components/common/Column';
import Heading from '@/components/common/Heading';
import Input from '@/components/common/Input';
import TitleBar from '@/components/common/TitleBar';
import { defaultMapSettings } from '../Map/map-settings';

interface ConnectPouchFormProps {
    settings: ProjectSettings,
    onConnect: (settings: ProjectSettings) => void;
    onClose: () => void;
}

const ConnectPouchForm: React.FC<ConnectPouchFormProps> = ({ settings, onConnect, onClose }) => {

    const [url, setUrl] = useState<string>(settings.url);
    const [password, setPassword] = useState<string>(settings.password);

    const onSubmit = () => {

        Keyboard.dismiss();
        onConnect({ url, password, connected: true, mapSettings: defaultMapSettings() });
    };

    return (
        <>
            <TitleBar
                title={ <Heading>Connect</Heading> }
                left={ <Button
                    title="Cancel"
                    variant="transparent"
                    icon={ <Ionicons name="close-outline" size={ 16 } /> }
                    onPress={ onClose }
                /> }
                right={ <Button variant="success" title="Connect" onPress={ onSubmit } /> }
            />
            <Column>
                <Input placeholder="URL"
                    value={ url }
                    onChangeText={ setUrl }
                    autoCapitalize="none"
                    autoCorrect={ false }
                    autoFocus
                />
                <Input placeholder="Password"
                    secureTextEntry
                    value={ password }
                    onChangeText={ setPassword }
                    autoCapitalize="none"
                    autoCorrect={ false }
                />
            </Column>
        </>
    );
};

export default ConnectPouchForm;
