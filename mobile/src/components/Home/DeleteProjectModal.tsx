import { Button, Column, Input, Modal, Text } from 'native-base';
import React, { useState } from 'react';

interface DeleteProjectModalProps {
    project: string;
    isOpen: boolean;
    onProjectDeleted: (project: string) => void;
    onClose: () => void;
}


const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({ project, isOpen, onProjectDeleted, onClose }) => {

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
        isCentered
        isOpen={ isOpen }
        onClose={ onCancel }
        motionPreset="fade"
        closeOnOverlayClick
    >
        <Modal.Content>
            <Modal.CloseButton />
            <Modal.Header>
                <Text bold>
                    Delete project
                </Text>
            </Modal.Header>
            <Modal.Body>
                <Column space={ 3 }>
                    <Text>
                        This will delete the project and all associated data.
                    </Text>
                    <Text>
                        Type <Text bold>{ project }</Text> to confirm.
                    </Text>
                    <Input
                        p={ 2 }
                        mt={ 2 }
                        value={ projectVal }
                        onChangeText={ setProjectVal }
                        autoCapitalize="none"
                        autoCompleteType="off"
                        autoCorrect={ false }
                        autoFocus
                    />
                </Column>
            </Modal.Body>
            <Modal.Footer space={ 2 }>
                <Button
                    colorScheme="red"
                    size="md"
                    onPress={ onDelete }
                    isDisabled={ project !== projectVal }
                    _text={ { color: 'white', fontWeight: 'semibold' } }
                >
                    Delete
                </Button>
                <Button size="md" onPress={ onCancel }>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal.Content>
    </Modal>;
};

export default DeleteProjectModal;
