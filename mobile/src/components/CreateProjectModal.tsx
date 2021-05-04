import { Button, FormControl, Input, Modal, Stack, Text } from 'native-base';
import React, { useState } from 'react';

interface CreateProjectModalProps {
    isOpen: boolean;
    onProjectCreated: (project: string) => void;
    onClose: () => void;
}


const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onProjectCreated, onClose }) => {

    const [project, setProject] = useState<string>('');


    const onCreate = () => {

        setProject('');
        onProjectCreated(project);
        onClose();
    };


    const onCancel = () => {

        setProject('');
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
                    Create project
                </Text>
            </Modal.Header>
            <Modal.Body>
                <FormControl isRequired isInvalid={ project === '' }>
                    <Stack>
                        <FormControl.Label>Project name</FormControl.Label>
                        <Input
                            p={ 2 }
                            mt={ 2 }
                            value={ project }
                            onChangeText={ setProject }
                            autoCapitalize={ false }
                            autoCompleteType="off"
                            autoCorrect={ false }
                            autoFocus
                        />
                        <FormControl.HelperText mt={ 1 }>
                            The project name is the unique identifier for the project.
                            Make sure to use the exact same project name if you intend to sync
                            to other instances of iDAI.field.
                        </FormControl.HelperText>
                        { project === '' && <FormControl.ErrorMessage mt={ 1 }>
                            Project name must not be empty.
                        </FormControl.ErrorMessage> }
                    </Stack>
                </FormControl>
            </Modal.Body>
            <Modal.Footer space={ 2 }>
                <Button colorScheme="green" size="md" onPress={ onCreate } isDisabled={ !project }>
                    Create
                </Button>
                <Button colorScheme="red" size="md" _text={ { color: 'white', fontWeight: 'semibold' } }
                    onPress={ onCancel }
                >
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal.Content>
    </Modal>;
};

export default CreateProjectModal;
