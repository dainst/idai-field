import { Ionicons } from '@expo/vector-icons';
import { Field } from 'idai-field-core';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Button from '../Button';
import Card from '../Card';
import Heading from '../Heading';
import I18NLabel from '../I18NLabel';
import Row from '../Row';
import TitleBar from '../TitleBar';

interface ChoiceModalProps {
    onClose: () => void;
    choices: ItemData;
    field: Field
    setValue: (label: string) => void;
}

export interface ItemData {
    [key: string]: {selected: boolean; label: string};
}

const ChoiceModal: React.FC<ChoiceModalProps> = ({ onClose, choices, field, setValue }) => {


    return (
        <Modal onRequestClose={ onClose } animationType="fade" transparent visible={ true }>
            <View style={ styles.container }>
                <Card style={ styles.card }>
                    <TitleBar
                        title={ <Heading>
                                    <I18NLabel label={ field } />
                                </Heading> }
                        left={ <Button
                            title="Close"
                            variant="transparent"
                            icon={ <Ionicons name="close-outline" size={ 16 } /> }
                            onPress={ onClose }
                        /> }
                    />
                    <ScrollView>
                        {Object.keys(choices).map(choice => (
                            <View key={ choice }>
                                <Row style={ { alignItems: 'center' } }>
                                    <TouchableOpacity onPress={ () => setValue(choice) }>
                                        <Ionicons
                                            name={ choices[choice].selected ? 'checkbox-outline' : 'stop-outline' }
                                            size={ 24 } color="black" />
                                    </TouchableOpacity>
                                    <Text style={ { marginLeft: 2 } }>{choice}</Text>
                                </Row>
                            </View>
                        ))}
                    </ScrollView>
                </Card>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        marginTop: 200,
        alignItems: 'center'
    },
    card: {
        padding: 10,
        height: '60%',
        width: '60%',
        opacity: 0.9
    },
});

export default ChoiceModal;