import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, View, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/common/Button';
import Heading from '@/components/common/Heading';
import Input from '@/components/common/Input';
import TitleBar from '@/components/common/TitleBar';
import { colors } from '@/utils/colors';
import {
    getSyncUrlInvalidText,
    validateSyncUrl,
} from '@/utils/sync-url-validation';
import {
    getProjectNameInvalidText,
    validateProjectName,
} from './project-name-validation';

interface LoadProjectModalProps {
    existingProjects?: string[];
    onProjectLoad: (project: string, url: string, password: string) => void;
    onClose: () => void;
}

const LoadProjectModal: React.FC<LoadProjectModalProps> = ({
    existingProjects = [],
    onClose,
    onProjectLoad,
}) => {
    const [project, setProject] = useState<string>('');
    const [projectTouched, setProjectTouched] = useState<boolean>(false);
    const [url, setUrl] = useState<string>('');
    const [urlTouched, setUrlTouched] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const insets = useSafeAreaInsets();
    const projectNameValidation = validateProjectName(project, existingProjects);
    const { projectId } = projectNameValidation;
    const syncUrlValidation = validateSyncUrl(url);
    const syncUrl = syncUrlValidation.url;
    const syncPassword = password.trim();
    const showProjectNameError = projectTouched && !projectNameValidation.isAvailable;
    const showUrlError = urlTouched && !syncUrlValidation.isValid;
    const canLoadProject =
        projectNameValidation.isAvailable
        && syncUrlValidation.isValid
        && syncPassword.length > 0;

    const onCreate = () => {
        if (!canLoadProject) return;

        onProjectLoad(projectId, syncUrl, syncPassword);
        resetForm();
        onClose();
    };

    const onCancel = () => {
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setProject('');
        setProjectTouched(false);
        setUrl('');
        setUrlTouched(false);
        setPassword('');
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
                        title={<Heading>서버에서 프로젝트 가져오기</Heading>}
                        left={
                            <Button
                                title="닫기"
                                variant="transparent"
                                icon={<Ionicons name="close-outline" size={16} />}
                                onPress={onCancel}
                            />
                        }
                        right={
                            <Button
                                title="가져오기"
                                variant="mellow"
                                onPress={onCreate}
                                isDisabled={!canLoadProject}
                                testID="load-project-submit"
                            />
                        }
                    />
                    
                    <View style={styles.formContainer}>
                        <Input
                            placeholder="프로젝트 이름"
                            testID="load-input"
                            value={project}
                            onChangeText={(value) => {
                                setProjectTouched(true);
                                setProject(value);
                            }}
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoFocus
                            invalidText={getProjectNameInvalidText(projectNameValidation)}
                            isValid={showProjectNameError ? false : undefined}
                            style={styles.input}
                        />
                        <Input
                            placeholder="URL"
                            testID="load-url-input"
                            value={url}
                            onChangeText={(value) => {
                                setUrlTouched(true);
                                setUrl(value);
                            }}
                            autoCapitalize="none"
                            autoCorrect={false}
                            invalidText={getSyncUrlInvalidText(syncUrlValidation)}
                            isValid={showUrlError ? false : undefined}
                            style={styles.input}
                        />
                        <Input
                            placeholder="비밀번호"
                            testID="load-password-input"
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
