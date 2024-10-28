import { Ionicons } from '@expo/vector-icons';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';
import { Document } from 'idai-field-core';
import React, { Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '../common/Button';
import Row from '../common/Row';
import DocumentsList from './DocumentsList';

export type DocumentsDrawerStackParamList = {
  DocumentsList: { documents: Document[] };
};

interface DocumentsDrawerProps {
  documents: Document[];
  currentParent?: Document;
  hierarchyNavigationRef: Ref<NavigationContainerRef>;
  onDocumentSelected: (document: Document) => void;
  onParentSelected: (document: Document) => void;
  onHomeButtonPressed: () => void;
  onSettingsButtonPressed: () => void;
  onHierarchyBack: () => void;
}

const Stack = createStackNavigator<DocumentsDrawerStackParamList>();

const DocumentsDrawer: React.FC<DocumentsDrawerProps> = ({
  documents,
  currentParent,
  hierarchyNavigationRef,
  onHomeButtonPressed,
  onSettingsButtonPressed,
  onHierarchyBack,
  ...listProps
}) => {
  return (
    <View style={{ flex: 1, flexDirection: 'column-reverse' }}>
      <Row style={{ alignItems: 'flex-end' }}>
        <Button
          style={{ flex: 1 }}
          onPress={onHomeButtonPressed}
          icon={<Ionicons name="home" size={18} />}
        />
        <Button
          style={{ flex: 1 }}
          onPress={onSettingsButtonPressed}
          icon={<Ionicons name="settings" size={18} />}
        />
      </Row>
      {(documents.length > 0 || currentParent) && (
        <View style={styles.listContainer}>
          <NavigationContainer independent={true} ref={hierarchyNavigationRef}>
            <Stack.Navigator>
              <Stack.Screen
                name="DocumentsList"
                options={{
                  title: currentParent?.resource.identifier || 'Operations',
                  // eslint-disable-next-line react/display-name
                  headerLeft: (props) =>
                    props.canGoBack ? (
                      <Button
                        icon={<Ionicons name="chevron-back" size={18} />}
                        variant="transparent"
                        onPress={() => onHierarchyBack()}
                      />
                    ) : null,
                  ...TransitionPresets.SlideFromRightIOS,
                }}
              >
                {() => <DocumentsList {...listProps} documents={documents} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      )}
    </View>
  );
};

export default DocumentsDrawer;

const styles = StyleSheet.create({
  listContainer: {
    overflow: 'hidden',
    flex: 1,
  },
});
