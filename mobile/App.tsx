import React, { ReactElement, useState } from 'react';
import { enableScreens } from 'react-native-screens';
import TabNavigator from './src/navigation/TabNavigator';
import AppLoading from 'expo-app-loading';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import PouchDbContextProvider from './src/data/pouchdb/PouchContextProvider';
import { Root } from 'native-base';


const fetchFonts = () => {
    return Font.loadAsync({
        Roboto: require('native-base/Fonts/Roboto.ttf'),
        Roboto_medium: require('native-base/Fonts/Roboto_medium.ttf'),
        ...Ionicons.font,
    });
};

enableScreens();

export default function App(): ReactElement {

    const [fontLoaded, setFontLoaded] = useState(false);

    if(!fontLoaded){
        return <AppLoading
                    startAsync={ fetchFonts }
                    onFinish={ () => setFontLoaded(true) }
                    onError={ (err) => console.log(err) } />;
    }

    return (
        <Root>
            <NavigationContainer>
                <PouchDbContextProvider>
                    <TabNavigator />
                </PouchDbContextProvider>
            </NavigationContainer>
        </Root>
    );
}
