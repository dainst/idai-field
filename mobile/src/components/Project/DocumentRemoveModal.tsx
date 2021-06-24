import { Ionicons } from '@expo/vector-icons';
import { Document, ProjectConfiguration } from 'idai-field-core';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import useToast from '../../hooks/use-toast';
import { DocumentRepository } from '../../repositories/document-repository';
import Button from '../common/Button';
import Card from '../common/Card';
import CategoryIcon from '../common/CategoryIcon';
import Heading from '../common/Heading';
import Input from '../common/Input';
import TitleBar from '../common/TitleBar';
import { ToastType } from '../common/Toast/ToastProvider';
interface RemoveModalProps {
    repository: DocumentRepository;
    config: ProjectConfiguration
    doc: Document | undefined;
    onClose: () => void
}

const DocumentRemoveModal: React.FC<RemoveModalProps> = (props) => {
    
    const [docValue, setDocValue] = useState<string>('');
    const { showToast } = useToast();

    const onDelete = () => {
        if(props.doc){
            const identifier = props.doc.resource.identifier;
            props.repository.remove(props.doc).then(() => {
                showToast(ToastType.Info, `Removed ${identifier}`);
            }).catch(err => showToast(ToastType.Error, `Could not remove ${identifier}: ${err}`));
            props.onClose();
        }
    };

    if(!props.doc) return null;

    const identifier = props.doc.resource.identifier;
    
    return (
        <Modal onRequestClose={ props.onClose } animationType="fade"
            transparent visible={ true }>
            <View style={ styles.container }>
                <Card style={ styles.card }>
                    <TitleBar
                        title={
                            <>
                                <CategoryIcon
                                    category={ props.doc.resource.category }
                                    config={ props.config } size={ 25 } />
                                <Heading style={ styles.heading }>Remove {identifier}</Heading>
                            </> }
                        left={ <Button
                            title="Cancel"
                            variant="transparent"
                            icon={ <Ionicons name="close-outline" size={ 16 } /> }
                            onPress={ props.onClose }
                        /> }
                        right={ <Button
                            title={ 'Delete' }
                            variant={ 'danger' }
                            onPress={ onDelete }
                            isDisabled={ docValue !== identifier }
                        /> }
                    />
                    <View style={ styles.form }>
                        <Text>This will delete resource {identifier} and all associated data</Text>
                        <Text>Type <Text style={ { fontWeight: 'bold' } }>{identifier} </Text>to confirm</Text>
                        <Input
                            value={ docValue }
                            onChangeText={ setDocValue }
                            autoCapitalize="none"
                            autoCompleteType="off"
                            autoCorrect={ false }
                            autoFocus
                        />
                    </View>

                </Card>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex:1,
        flexDirection: 'column',
        marginTop: 200,
        alignItems: 'center'
    },
    heading: {
        marginLeft: 10,
    },
    card: {
        padding: 10,
        height: '30%',
        width: '70%',
        opacity: 0.9
    },
    form: {
        padding: 10,
    }
});

export default DocumentRemoveModal;