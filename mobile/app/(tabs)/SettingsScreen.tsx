import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PreferencesContext } from '@/contexts/preferences-context';
import Button from '@/components/common/Button';
import Column from '@/components/common/Column';
import Heading from '@/components/common/Heading';
import Input from '@/components/common/Input';
import TitleBar from '@/components/common/TitleBar';
import { router } from 'expo-router';
import { colors } from '@/utils/colors';

const SettingsScreen: React.FC = () => {
  const preferences = useContext(PreferencesContext);
  const insets = useSafeAreaInsets();

  const [usernameVal, setUsernameVal] = useState(
    preferences.preferences.username
  );

  const saveSettings = () => {
    preferences.setUsername(usernameVal);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }
      ]}
    >
      <View style={styles.content}>
        <TitleBar
          title={<Heading>Settings</Heading>}
          left={
            <Button
              variant="transparent"
              onPress={() => router.back()}
              title="Cancel"
              icon={<Ionicons name="close-outline" size={16} />}
            />
          }
          right={
            <Button
              variant="success"
              onPress={saveSettings}
              title="Save"
              isDisabled={usernameVal === ''}
            />
          }
        />
        
        <Column style={styles.formContainer}>
          <Input
            label="Editor name"
            value={usernameVal}
            onChangeText={setUsernameVal}
            autoCorrect={false}
            autoFocus
            helpText="The editor name is saved in the editing history in order
                        to allow dataset changes to be attributable to a person."
            isValid={usernameVal !== ''}
            invalidText="Editor name must not be empty."
            style={styles.input}
          />
        </Column>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.containerBackground,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  formContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  input: {
    width: '100%',
  },
});

export default SettingsScreen;