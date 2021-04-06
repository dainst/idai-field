import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SettingsScreen from '../screens/SettingsScreen';
import { Ionicons } from '@expo/vector-icons';
import StackNavigator from './StackNavigator';
import { headerBackgroundColor } from '../constants/colors';

type possibleIcon = 'home' | 'home-outline' | 'list' | 'list-sharp' | undefined;

const Tab = createBottomTabNavigator();

const TabNavigator = (): JSX.Element => (
    <Tab.Navigator
        screenOptions={
            ({ route }) => ({
                tabBarIcon: function test({ focused, color, size }) {
                let iconName: possibleIcon;

                if (route.name === 'Home') {
                    iconName = focused ? 'home': 'home-outline';
                } else if (route.name === 'Settings') {
                    iconName = focused ? 'list-sharp' : 'list';
                }

                return <Ionicons name={ iconName } size={ size } color={ color } />;
                },
            })
        }
        tabBarOptions={ {
            activeTintColor: 'white',
            inactiveTintColor: 'gray',
            style: {
                backgroundColor: headerBackgroundColor
            }
        } }>
        <Tab.Screen name="Home" component={ StackNavigator } />
        <Tab.Screen name="Settings" component={ SettingsScreen } />
    </Tab.Navigator>
);


export default TabNavigator;