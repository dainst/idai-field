import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, View, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/common/Button';
import Heading from '@/components/common/Heading';
import Input from '@/components/common/Input';
import TitleBar from '@/components/common/TitleBar';
import { colors } from '@/utils/colors';

interface LoadProjectModalProps {
    onProjectLoad: (project: string, url: string, password: string) => void;
    onClose: () => void;
}

const LoadProjectModal: React.FC<LoadProjectModalProps> = ({ onClose, onProjectLoad }) => {
    const [project, setProject] = useState<string>('');
    const [url, setUrl] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const insets = useSafeAreaInsets();

    const onCreate = () => {
        onProjectLoad(project, url, password);
        setProject('');
        onClose();
    };

    const onCancel = () => {
        setProject('');
        onClose();
    };

    return (
        <Modal
            onRequestClose={onCancel}
            animationType="slide"
            presentationStyle="formSheet"
        >
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[
                    styles.container,
                    {
                        paddingTop: insets.top,
                        paddingBottom: insets.bottom,
                        paddingLeft: insets.left,
                        paddingRight: insets.right,
                    }
                ]}
            >
                <View style={styles.content}>
                    <TitleBar
                        title={<Heading>Load project from server</Heading>}
                        left={
                            <Button
                                title="Cancel"
                                variant="transparent"
                                icon={<Ionicons name="close-outline" size={16} />}
                                onPress={onCancel}
                            />
                        }
                        right={
                            <Button
                                title="Load"
                                variant="mellow"
                                onPress={onCreate}
                                isDisabled={!project || !url || !password}
                            />
                        }
                    />
                    
                    <View style={styles.formContainer}>
                        <Input
                            placeholder="Project"
                            testID="load-input"
                            value={project}
                            onChangeText={setProject}
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoFocus
                            style={styles.input}
                        />
                        <Input
                            placeholder="URL"
                            value={url}
                            onChangeText={setUrl}
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={styles.input}
                        />
                        <Input
                            placeholder="Password"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={styles.input}
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.containerBackground,
    },
    content: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    formContainer: {
        flex: 1,
        padding: 24,
        paddingTop: 32,
    },
    input: {
        width: '100%',
        marginBottom: 16,
    },
});

export default LoadProjectModal;