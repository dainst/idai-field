import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { SyncStatus } from 'idai-field-core';
import React, { useContext, useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';
import { AppStackParamList } from '../../../App';
import { PreferencesContext } from '../../contexts/preferences-context';
import usePouchdbDatastore from '../../hooks/use-pouchdb-datastore';
import useSync from '../../hooks/use-sync';
import { colors } from '../../utils/colors';
import Button from '../common/Button';
import Heading from '../common/Heading';
import TitleBar from '../common/TitleBar';

type DocumentAddNav = StackNavigationProp<AppStackParamList, 'LoadingScreen'>;

interface LoadingScreenProps {
    navigation: DocumentAddNav;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ navigation }) => {

    const preferences = useContext(PreferencesContext);

    const pouchdbDatastore = usePouchdbDatastore(preferences.preferences.currentProject);

    const syncStatus = useSync(
        preferences.preferences.currentProject,
        preferences.preferences.projects[preferences.preferences.currentProject],
        pouchdbDatastore,
    );

    useEffect(() => {

        if (syncStatus === SyncStatus.InSync) {
            navigation.navigate('ProjectScreen');
        }
    }, [syncStatus, navigation]);

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
                { (syncStatus === SyncStatus.Pulling
                        || syncStatus === SyncStatus.Pushing)
                    && <ActivityIndicator
                        size="large"
                        color={ colors.primary }
                        style={ styles.loadingSpinner }
                    />
                }
                { (syncStatus === SyncStatus.Error
                        || syncStatus === SyncStatus.AuthenticationError
                        || syncStatus === SyncStatus.AuthorizationError)
                    && <MaterialIcons name="error" size={ 35 } color={ colors.danger } />
                }
                <Button variant="primary" title={ 'Cancel' } onPress={ returnToHomeScreen } />
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
