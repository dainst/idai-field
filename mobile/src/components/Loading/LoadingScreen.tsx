import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { SyncStatus } from 'idai-field-core';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { AppStackParamList } from '../../../App';
import { PreferencesContext } from '../../contexts/preferences-context';
import useConfiguration from '../../hooks/use-configuration';
import usePouchdbDatastore from '../../hooks/use-pouchdb-datastore';
import useRepository from '../../hooks/use-repository';
import useSync from '../../hooks/use-sync';
import { colors } from '../../utils/colors';
import Button from '../common/Button';
import Heading from '../common/Heading';
import Row from '../common/Row';
import TitleBar from '../common/TitleBar';

type DocumentAddNav = StackNavigationProp<AppStackParamList, 'LoadingScreen'>;

interface LoadingScreenProps {
    navigation: DocumentAddNav;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ navigation }) => {

    const preferences = useContext(PreferencesContext);

    const [showSpinner, setShowSpinner] = useState<boolean>(false);
    const [showError, setShowError] = useState<boolean>(false);
    const [status, setStatus] = useState<string>('');

    const pouchdbDatastore = usePouchdbDatastore(preferences.preferences.currentProject);

    const config = useConfiguration(
        preferences.preferences.currentProject,
        preferences.preferences.languages,
        preferences.preferences.username,
        pouchdbDatastore,
    );

    const repository = useRepository(
        preferences.preferences.username,
        config?.getCategories() || [],
        pouchdbDatastore,
    );

    const syncStatus = useSync(
        preferences.preferences.currentProject,
        preferences.preferences.projects[preferences.preferences.currentProject],
        repository,
        pouchdbDatastore,
    );
    

    useEffect(() => {
     
        if(syncStatus === SyncStatus.Offline){
            setShowSpinner(false);
            setStatus('Offline');
        } else if(syncStatus === SyncStatus.AuthenticationError ||
            syncStatus === SyncStatus.AuthorizationError ||
            syncStatus === SyncStatus.Error) {
                setStatus(syncStatus);
                setShowSpinner(false);
                setShowError(true);
                preferences.removeProject(preferences.preferences.currentProject);
        } else if(syncStatus === SyncStatus.Pulling) {
            setStatus('Loading....');
            setShowSpinner(true);
        } else if(syncStatus === SyncStatus.InSync) {
            navigation.navigate('ProjectScreen');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [syncStatus, preferences.preferences.currentProject]);


    const returnToHomeScreen = () => {
        disconnect();
        navigation.navigate('HomeScreen');
    };


    const disconnect = () => {
        const currentSettings = preferences.preferences.projects[preferences.preferences.currentProject];
        preferences.setProjectSettings(
            preferences.preferences.currentProject,
            { ...currentSettings, connected: false }
        );
    };

    // Add header
    return (
        <SafeAreaView style={ styles.container }>
            <TitleBar
                title={
                    <Heading>Loading { preferences.preferences.currentProject }</Heading>
                }
                left={ <Button
                    variant="transparent"
                    onPress={ returnToHomeScreen }
                    icon={ <Ionicons name="chevron-back" size={ 24 } /> }
                    /> }
            />
            <View style={ styles.statusContainer }>
                { showSpinner && <ActivityIndicator
                                    size="large"
                                    color={ colors.primary }
                                    style={ styles.loadingSpinner } />}
                <Row>
                    {showError && <MaterialIcons name="error" size={ 35 } color={ colors.danger } />}
                    <Text style={ styles.loadingText }>{status}</Text>
                </Row>
                {(showError || showSpinner) && <Button
                    variant="primary"
                    title={ showSpinner ? 'Cancel' : 'Return' }
                    onPress={ returnToHomeScreen } />}
            </View>
            
           
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    statusContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingSpinner: {
        margin: 5,
    },
    loadingText: {
        fontSize: 17,
        margin: 10
    }
});


export default LoadingScreen;
