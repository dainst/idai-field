import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import React, { useContext, useEffect } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { AppParamList } from '../../../App';
import { PreferencesContext } from '../../contexts/preferences-context';
import usePouchdbDatastore from '../../hooks/use-pouchdb-datastore';
import useSync from '../../hooks/use-sync';
import { colors } from '../../utils/colors';
import Button from '../common/Button';
import Heading from '../common/Heading';
import TitleBar from '../common/TitleBar';
import { SyncStatus } from 'idai-field-core';

type DocumentAddNav = BottomTabNavigationProp<AppParamList, 'LoadingScreen'>;

interface LoadingScreenProps {
  navigation: DocumentAddNav;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ navigation }) => {
  const preferences = useContext(PreferencesContext);

  const pouchdbDatastore = usePouchdbDatastore(
    preferences.preferences.currentProject
  );

  const syncStatus = useSync(
    preferences.preferences.currentProject,
    preferences.preferences.projects[preferences.preferences.currentProject],
    pouchdbDatastore,
    false
  );

  useEffect(() => {
    if (syncStatus === SyncStatus.InSync) {
      navigation.navigate('ProjectScreen');
    }
  }, [syncStatus, navigation]);

  const cancel = () => {
    preferences.removeProject(preferences.preferences.currentProject);
    navigation.navigate('HomeScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
      <TitleBar
        title={
          <Heading>Loading {preferences.preferences.currentProject}</Heading>
        }
        left={
          <Button
            variant="transparent"
            onPress={cancel}
            icon={<Ionicons name="chevron-back" size={24} />}
          />
        }
      />
      <View style={styles.statusContainer}>
        {syncStatus === SyncStatus.Error ||
        syncStatus === SyncStatus.AuthenticationError ||
        syncStatus === SyncStatus.AuthorizationError ? (
          <MaterialIcons name="error" size={35} color={colors.danger} />
        ) : (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loadingSpinner}
          />
        )}
        <Button variant="danger" title={'Cancel'} onPress={cancel} />
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
    alignItems: 'center',
  },
  loadingSpinner: {
    margin: 5,
  },
  loadingText: {
    fontSize: 17,
    margin: 10,
  },
});

export default LoadingScreen;
