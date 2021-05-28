import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../common/Button';
import Column from '../common/Column';
import Heading from '../common/Heading';
import Input from '../common/Input';
import TitleBar from '../common/TitleBar';

interface DeleteProjectModalProps {
    project: string;
    onProjectDeleted: (project: string) => void;
    onClose: () => void;
}


const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({ project, onProjectDeleted, onClose }) => {

    const [projectVal, setProjectVal] = useState<string>('');


    const onDelete = () => {

        setProjectVal('');
        onProjectDeleted(project);
        onClose();
    };


    const onCancel = () => {

        setProjectVal('');
        onClose();
    };


    return <Modal
        onRequestClose={ onCancel }
        animationType="slide"
    >
        <SafeAreaView>
            <TitleBar
                title={ <Heading>Delete project</Heading> }
                left={ <Button
                    title="Cancel"
                    variant="transparent"
                    icon={ <Ionicons name="close-outline" size={ 16 } /> }
                    onPress={ onCancel }
                /> }
                right={ <Button
                    title="Delete"
                    variant="danger"
                    onPress={ onDelete }
                    isDisabled={ project !== projectVal }
                /> }
            />
            <Column style={ { padding: 15 } }>
                <Text>
                    This will delete the project and all associated data.
                </Text>
                <Text>
                    Type <Text style={ { fontWeight: 'bold' } }>{ project }</Text> to confirm.
                </Text>
                <Input
                    testID="project-input"
                    value={ projectVal }
                    onChangeText={ setProjectVal }
                    autoCapitalize="none"
                    autoCompleteType="off"
                    autoCorrect={ false }
                    autoFocus
                />
            </Column>
        </SafeAreaView>
    </Modal>;
};

export default DeleteProjectModal;
