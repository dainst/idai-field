import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from 'mobile/App';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Preferences } from '../../models/preferences';
import Button from '../common/Button';
import Column from '../common/Column';
import Heading from '../common/Heading';
import Input from '../common/Input';
import TitleBar from '../common/TitleBar';


interface SettingsScreenProps {
    navigation: StackNavigationProp<AppStackParamList, 'SettingsScreen'>;
    preferences: Preferences;
    setUsername: (username: string) => void;
}


const SettingsScreen: React.FC<SettingsScreenProps> = ({
    navigation,
    preferences,
    setUsername
}) => {

    const [usernameVal, setUsernameVal] = useState(preferences.username);

    const saveSettings = () => {

        setUsername(usernameVal);
        navigation.goBack();
    };

    return (
        <SafeAreaView style={ styles.container }>
            <TitleBar title={ <Heading>Settings</Heading> }
                left={ <Button
                    variant="transparent"
                    onPress={ () => navigation.goBack() }
                    title="Cancel"
                    icon={ <Ionicons name="close-outline" size={ 16 } /> }
                /> }
                right={ <Button variant="success" onPress={ () => saveSettings() } title="Save" /> }
            />
            <Column style={ styles.contentColumn }>
                <Input
                    label="Editor name"
                    value={ usernameVal }
                    onChangeText={ setUsernameVal }
                    autoCompleteType="name"
                    autoCorrect={ false }
                    autoFocus
                    helpText="The editor name is saved in the editing history in order
                        to allow dataset changes to be attributable to a person."
                    isValid={ usernameVal !== '' }
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
    }
});
