import { Ionicons } from '@expo/vector-icons';
import {
  CategoryForm,
  Field,
  Group,
  Groups,
  NewResource,
  Resource,
} from 'idai-field-core';
import React, { ReactNode, useEffect, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../../utils/colors';
import Button from '../Button';
import CategoryIcon from '../CategoryIcon';
import Heading from '../Heading';
import I18NLabel from '../I18NLabel';
import TitleBar from '../TitleBar';
import EditFormField from './EditFormField';

interface DocumentFormProps {
  category: CategoryForm;
  headerText: string;
  returnBtnHandler: () => void;
  titleBarRight: ReactNode;
  resource: Resource | NewResource | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateFunction: (key: string, value: any) => void;
}

const BTN_SIZE = 18;

const DocumentForm: React.FC<DocumentFormProps> = ({
  category,
  headerText,
  returnBtnHandler,
  titleBarRight,
  resource,
  updateFunction,
}) => {
  const [activeGroup, setActiveGroup] = useState<Group>(category.groups[0]);

  useEffect(() => setActiveGroup(category?.groups[0]), [category]);

  const renderItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      onPress={() => setActiveGroup(item)}
      style={styles.groupBtn}
      testID={`groupSelect_${item.name}`}
    >
      <I18NLabel style={styleGroupText(item, activeGroup)} label={item} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} testID="documentForm">
      <TitleBar
        title={
          <>
            <CategoryIcon category={category} size={25} />
            <Heading style={styles.heading}>{headerText}</Heading>
          </>
        }
        left={
          <Button
            variant="transparent"
            onPress={returnBtnHandler}
            icon={<Ionicons name="chevron-back" size={BTN_SIZE} />}
          />
        }
        right={titleBarRight}
      />
      <View style={styles.groupsContainer}>
        <FlatList
          data={category.groups}
          keyExtractor={(group) => group.name}
          renderItem={renderItem}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
        />
      </View>
      <View style={styles.groupForm}>
        <FlatList
          data={activeGroup.fields.filter(
            (fieldDef) => shouldShow(fieldDef) && resource
          )}
          keyExtractor={(field) => field.name}
          renderItem={({ item }) => (
            <EditFormField
              setFunction={updateFunction}
              field={item}
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              currentValue={resource![item.name]}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const shouldShow = (field: Field) =>
  field !== undefined && field.editable === true;

const styleGroupText = (activeGroup: Group, group: Group): TextStyle =>
  group.name === activeGroup.name
    ? { ...styles.groupText, ...styles.groupTextActive }
    : styles.groupText;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  heading: {
    marginLeft: 10,
  },
  groupsContainer: {
    margin: 5,
    padding: 5,
  },
  groupForm: {
    padding: 10,
  },
  groupBtn: {
    margin: 4,
  },
  groupText: {
    color: colors.primary,
    fontSize: 20,
    textTransform: 'capitalize',
    padding: 2,
  },
  groupTextActive: {
    color: colors.secondary,
    padding: 5,
    backgroundColor: colors.primary,
  },
});

export default DocumentForm;
