import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Keyboard } from 'react-native';
import { ProjectSettings } from '@/models/preferences';
import { normalizeProjectSettings } from '@/models/project-settings';
import {
    getSyncUrlInvalidText,
    validateSyncUrl,
} from '@/utils/sync-url-validation';
import Button from '@/components/common/Button';
import Column from '@/components/common/Column';
import Heading from '@/components/common/Heading';
import Input from '@/components/common/Input';
import TitleBar from '@/components/common/TitleBar';

interface ConnectPouchFormProps {
    settings: ProjectSettings,
    onConnect: (settings: ProjectSettings) => void;
    onClose: () => void;
}

const ConnectPouchForm: React.FC<ConnectPouchFormProps> = ({ settings, onConnect, onClose }) => {

    const normalizedSettings = normalizeProjectSettings(settings);
    const [url, setUrl] = useState<string>(normalizedSettings.url);
    const [urlTouched, setUrlTouched] = useState<boolean>(
        normalizedSettings.url.trim().length > 0
    );
    const [password, setPassword] = useState<string>(normalizedSettings.password);
    const syncUrlValidation = validateSyncUrl(url);
    const syncUrl = syncUrlValidation.url;
    const syncPassword = password.trim();
    const showUrlError = urlTouched && !syncUrlValidation.isValid;
    const canConnect = syncUrlValidation.isValid && syncPassword.length > 0;

    const onSubmit = () => {

        if (!canConnect) return;
        Keyboard.dismiss();
        onConnect({
            ...normalizedSettings,
            url: syncUrl,
            password: syncPassword,
            connected: true,
        });
    };

    return (
        <>
            <TitleBar
                title={ <Heading>동기화 연결</Heading> }
                left={ <Button
                    title="닫기"
                    variant="transparent"
                    icon={ <Ionicons name="close-outline" size={ 16 } /> }
                    onPress={ onClose }
                /> }
                right={ <Button
                    variant="success"
                    title="연결"
                    testID="sync-connect-submit"
                    isDisabled={ !canConnect }
                    onPress={ onSubmit }
                /> }
            />
            <Column>
                <Input placeholder="URL"
                    testID="sync-url-input"
                    value={ url }
                    onChangeText={ (value) => {
                        setUrlTouched(true);
                        setUrl(value);
                    } }
                    autoCapitalize="none"
                    autoCorrect={ false }
                    autoFocus
                    invalidText={ getSyncUrlInvalidText(syncUrlValidation) }
                    isValid={ showUrlError ? false : undefined }
                />
                <Input placeholder="비밀번호"
                    testID="sync-password-input"
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
