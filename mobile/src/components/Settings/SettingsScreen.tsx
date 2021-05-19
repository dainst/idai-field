import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from 'mobile/App';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Preferences } from '../../models/preferences';
import Button from '../common/Button';
import Column from '../common/Column';
import Input from '../common/Input';
import Row from '../common/Row';


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
            <Row style={ styles.topRow }>
                <View style={ { flex: 1, alignItems: 'flex-start' } }>
                    <Button
                        variant="transparent"
                        onPress={ () => navigation.goBack() }
                        title="Cancel"
                        icon={ <Ionicons name="close-outline" size={ 16 } /> }
                    />
                </View>
                <Text style={ styles.title }>Settings</Text>
                <View style={ { flex: 1, alignItems: 'flex-end' } }>
                    <Button variant="success" onPress={ () => saveSettings() } title="Save" />
                </View>
            </Row>
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
    topRow: {
        justifyContent: 'space-between',
        borderBottomColor: 'gray',
        borderBottomWidth: 1,
        padding: 5
    },
    title: {
        fontSize: 16,
        fontWeight: '500',
        padding: 10,
        flex: 1,
        textAlign: 'center'
    },
    contentColumn: {
        flex: 1,
        flexDirection: 'column',
        padding: 10,
    }
});
