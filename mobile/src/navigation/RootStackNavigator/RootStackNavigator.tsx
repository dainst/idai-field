import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../../screens/HomeScreen';
import { headerBackgroundColor } from '../../constants/colors';
import { RootStackParamList } from './RootStackParamList';
import PouchDbContext from '../../data/pouchdb/pouch-context';
import SettingsScreen from '../../screens/SettingsScreen';
import { Button, Icon } from 'native-base';

const Stack = createStackNavigator<RootStackParamList>();

const commonHeaderStyle = {
    backgroundColor: headerBackgroundColor
};

const RootStackNavigator = (): JSX.Element => {

    const { dbName } = useContext(PouchDbContext);

    return (
        <Stack.Navigator
            screenOptions={ {
                headerStyle: commonHeaderStyle,
                headerTintColor: 'white',
            } }
            initialRouteName="Settings">
            <Stack.Screen
                name="Settings"
                component={ SettingsScreen }
                options={ {
                    headerTitle: 'iDAIfield mobile',
                } }
            />
            <Stack.Screen
                name="Home"
                component={ HomeScreen }
                options={ ({ navigation }) => ({
                    headerTitle: dbName ? `Connected to ${dbName}` : 'iDAIfield mobile',
                    // eslint-disable-next-line react/display-name
                    headerRight: () => (
                        <Button onPress={ () => navigation.navigate('Settings') } transparent>
                            <Icon type="Ionicons" name="settings-outline" style={ { color: 'white' } } />
                        </Button>
                    )
                  }) }
                />
        </Stack.Navigator>
    );
};

export default RootStackNavigator;