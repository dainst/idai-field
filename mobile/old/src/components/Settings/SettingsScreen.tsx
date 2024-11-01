import { Ionicons } from '@expo/vector-icons';
// import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React, { useContext, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { AppParamList } from '../../../App';
import { PreferencesContext } from '../../contexts/preferences-context';
import Button from '../common/Button';
import Column from '../common/Column';
import Heading from '../common/Heading';
import Input from '../common/Input';
import TitleBar from '../common/TitleBar';
import { Router } from 'expo-router';


interface SettingsScreenProps {
  navigation: Router;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const preferences = useContext(PreferencesContext);

  const [usernameVal, setUsernameVal] = useState(
    preferences.preferences.username
  );

  const saveSettings = () => {
    preferences.setUsername(usernameVal);
    navigation.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TitleBar
        title={<Heading>Settings</Heading>}
        left={
          <Button
            variant="transparent"
            onPress={() => navigation.back()}
            title="Cancel"
            icon={<Ionicons name="close-outline" size={16} />}
          />
        }
        right={
          <Button
            variant="success"
            onPress={() => saveSettings()}
            title="Save"
          />
        }
      />
      <Column style={styles.contentColumn}>
        <Input
          label="Editor name"
          value={usernameVal}
          onChangeText={setUsernameVal}
          autoCompleteType="name"
          autoCorrect={false}
          autoFocus
          helpText="The editor name is saved in the editing history in order
                        to allow dataset changes to be attributable to a person."
          isValid={usernameVal !== ''}
          invalidText="Editor name must not be empty."
        />
      </Column>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ececec',
  },
  contentColumn: {
    flex: 1,
    flexDirection: 'column',
    padding: 10,
  },
});
