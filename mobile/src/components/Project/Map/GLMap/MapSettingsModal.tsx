import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../../utils/colors';
import Button from '../../../common/Button';
import Card from '../../../common/Card';
import Heading from '../../../common/Heading';
import Row from '../../../common/Row';
import TitleBar from '../../../common/TitleBar';

interface MapSettingsModalProps {
    onClose: () => void;
    pointRadius: number;
    onChangePointRadius: (radius: number) => void;
}

const MapSettingsModal: React.FC<MapSettingsModalProps> = ({ onClose, pointRadius, onChangePointRadius }) => {
    return (
        <Modal onRequestClose={ onClose } animationType="fade" transparent visible={ true }>
            <View style={ styles.container }>
                <Card style={ styles.card }>
                    <TitleBar
                        title={
                            <>
                                <Ionicons
                                    name="settings-outline"
                                    size={ 25 } color={ colors.primary }
                                    style={ { marginRight: 2 } } />
                                <Heading>Map Settings</Heading>
                            </>
                        }
                        left={ <Button
                            title="Close"
                            variant="transparent"
                            icon={ <Ionicons name="close-outline" size={ 16 } /> }
                            onPress={ onClose } /> } />
                    <Row style={ styles.sliderContainer }>
                        <Text>Point radius: </Text>
                        <Slider
                            style={ styles.slider }
                            minimumValue={ 0.2 }
                            maximumValue={ 4 }
                            minimumTrackTintColor="#5572a1"
                            maximumTrackTintColor="gray"
                            thumbTintColor={ colors.primary }
                            value={ pointRadius }
                            step={ 0.25 }
                            onValueChange={ onChangePointRadius } />
                    </Row>
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
    card: {
        padding: 10,
        height: '60%',
        width: '60%',
        opacity: 0.9
    },
    heading: {
        marginLeft: 10,
    },
    sliderContainer: {
        borderBottomWidth: 0.5,
        borderBottomColor: 'black',
        width: '80%',
        margin: 5
    },
    slider: {
        width: 200,
        height: 40,
    }
  
  
});

export default MapSettingsModal;