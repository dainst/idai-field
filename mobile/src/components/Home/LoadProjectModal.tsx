import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, SafeAreaView, StyleSheet, View } from 'react-native';
import Button from '../common/Button';
import Heading from '../common/Heading';
import Input from '../common/Input';
import TitleBar from '../common/TitleBar';

interface LoadProjectModalProps {
    onProjectLoad: (project: string, url: string, password: string) => void;
    onClose: () => void;
}

const LoadProjectModal: React.FC<LoadProjectModalProps> = ({ onClose, onProjectLoad }) => {

    const [project, setProject] = useState<string>('');
    const [url, setUrl] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const onCreate = () => {

        setProject('');
        onProjectLoad(project, url, password);
        onClose();
    };


    const onCancel = () => {

        setProject('');
        onClose();
    };

    return (
        <Modal onRequestClose={ onCancel } animationType="slide">
            <SafeAreaView>
                <TitleBar title={ <Heading>Load project from server</Heading> }
                    left={ <Button
                        title="Cancel"
                        variant="transparent"
                        icon={ <Ionicons name="close-outline" size={ 16 } /> }
                        onPress={ onCancel }
                    /> }
                    right={ <Button
                        title="Load"
                        variant="mellow"
                        onPress={ onCreate }
                        isDisabled={ !project || !url || !password }
                    /> }
                />
                <View style={ styles.formContainer }>
                    <Input
                        placeholder="Project"
                        testID="load-input"
                        value={ project }
                        onChangeText={ setProject }
                        autoCapitalize="none"
                        autoCompleteType="off"
                        autoCorrect={ false }
                        autoFocus
                    />
                    <Input
                        placeholder="URL"
                        value={ url }
                        onChangeText={ setUrl }
                        autoCapitalize="none"
                        autoCorrect={ false }
                    />
                    <Input
                        placeholder="Password"
                        secureTextEntry
                        value={ password }
                        onChangeText={ setPassword }
                        autoCapitalize="none"
                        autoCorrect={ false }
                    />
                </View>
            </SafeAreaView>
        </Modal>
    );
};


const styles = StyleSheet.create({
    formContainer: {
        alignItems: 'stretch',
        padding: 40,
    }
});
export default LoadProjectModal;
