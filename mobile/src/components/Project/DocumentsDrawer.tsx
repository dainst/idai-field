import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Document } from 'idai-field-core';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '../common/Button';
import Row from '../common/Row';
import DocumentsList, { DocumentsListProps } from './DocumentsList';


export type DocumentsDrawerStackParamList = {
    DocumentsList: undefined
};


interface DocumentsDrawerProps extends DocumentsListProps {
    currentParent?: Document;
    onHomeButtonPressed: () => void;
    onSettingsButtonPressed: () => void;
    onHierarchyBack: () => void;
}


const Stack = createStackNavigator<DocumentsDrawerStackParamList>();


const DocumentsDrawer: React.FC<DocumentsDrawerProps> = ({
    currentParent,
    onHomeButtonPressed,
    onSettingsButtonPressed,
    onHierarchyBack,
    ...listProps
}) => {

    return <>
        <View style={ styles.listContainer }>
            <NavigationContainer independent={ true }>
                <Stack.Navigator>
                    <Stack.Screen name="DocumentsList"
                        options={ {
                            title: currentParent?.resource.identifier || 'Operations',
                            // eslint-disable-next-line react/display-name
                            headerLeft: (props) =>
                                props.canGoBack
                                ? <Button
                                    icon={ <Ionicons name="chevron-back" size={ 18 } /> }
                                    variant="transparent"
                                    onPress={ () => {
                                        onHierarchyBack();
                                        props.onPress?.();
                                    } }
                                />
                                : null
                        } }
                    >
                        {({ navigation }) => <DocumentsList { ...listProps } navigation={ navigation } /> }
                    </Stack.Screen>
                </Stack.Navigator>
            </NavigationContainer>
        </View>
        <Row>
            <Button
                style={ { flex:1 } }
                onPress={ onHomeButtonPressed }
                icon={ <Ionicons name="home" size={ 18 } /> }
            />
            <Button
                style={ { flex:1 } }
                onPress={ onSettingsButtonPressed }
                icon={ <Ionicons name="settings" size={ 18 } /> }
            />
        </Row>
    </>;
};

export default DocumentsDrawer;


const styles = StyleSheet.create({
    listContainer: {
        overflow: 'hidden',
        flex: 1,
    }
});
