import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { SyncStatus } from 'idai-field-core';
import { Preferences, ProjectSettings } from 'mobile/src/models/preferences';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { AppStackParamList } from '../../../App';
import useConfiguration from '../../hooks/use-configuration';
import usePouchdbManager from '../../hooks/use-pouchdb-manager';
import useRepository from '../../hooks/use-repository';
import useSync from '../../hooks/use-sync';
import useToast from '../../hooks/use-toast';
import { colors } from '../../utils/colors';
import Button from '../common/Button';
import Heading from '../common/Heading';
import Row from '../common/Row';
import TitleBar from '../common/TitleBar';
import { ToastType } from '../common/Toast/ToastProvider';

type DocumentAddNav = StackNavigationProp<AppStackParamList, 'LoadingScreen'>;

interface LoadingScreenProps {
    currentProject: string;
    preferences: Preferences;
    removeProject: (project: string) => void;
    setProjectSettings: (project: string, projectSettings: ProjectSettings) => void;
    navigation: DocumentAddNav;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
        currentProject,
        preferences,
        removeProject,
        setProjectSettings,
        navigation }) => {

    const [showSpinner, setShowSpinner] = useState<boolean>(false);
    const [showError, setShowError] = useState<boolean>(false);
    const [status, setStatus] = useState<string>('');
    const { showToast } = useToast();

    const pouchdbManager = usePouchdbManager(currentProject);

    const config = useConfiguration(
        currentProject,
        preferences.languages,
        preferences.username,
        pouchdbManager,
    );

    const repository = useRepository(
        preferences.username,
        config?.getCategoryForest() || [],
        pouchdbManager,
    );

    const syncStatus = useSync(
        currentProject,
        preferences.projects[currentProject],
        repository,
        pouchdbManager,
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
                removeProject(currentProject);
        } else if(syncStatus === SyncStatus.Pulling) {
            setStatus('Loading....');
            setShowSpinner(true);
        } else if(syncStatus === SyncStatus.InSync) {
            showToast(ToastType.Success, `Loaded ${currentProject}`);
            navigation.navigate('HomeScreen');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [syncStatus, currentProject]);


    const returnToHomeScreen = () => {
        disconnect();
        navigation.navigate('HomeScreen');
    };


    const disconnect = () => {
        const currentSettings = preferences.projects[currentProject];
        setProjectSettings(currentProject, { ...currentSettings, connected: false });
    };

    // Add header
    return (
        <SafeAreaView style={ styles.container }>
            <TitleBar
                title={
                    <Heading>Load {currentProject}</Heading>
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