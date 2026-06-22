import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import {
  CategoryForm,
  Field,
  Group,
  KOREAN_FIELDWORK_GROUP_NAME,
  // Groups,
  NewResource,
  Resource,
} from 'idai-field-core';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '@/utils/colors';
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
const GROUP_PICKER_THRESHOLD = 6;

const DocumentForm: React.FC<DocumentFormProps> = ({
  category,
  headerText,
  returnBtnHandler,
  titleBarRight,
  resource,
  updateFunction,
}) => {
  const groups = useMemo(() => prioritizeKoreanFieldworkGroup(category.groups), [category.groups]);
  const [activeGroup, setActiveGroup] = useState<Group>(groups[0]);

  useEffect(() => setActiveGroup(groups[0]), [groups]);
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
          data={groups}
          keyExtractor={(group) => group.name}
          renderItem={renderItem}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
        />
        {groups.length >= GROUP_PICKER_THRESHOLD && (
          <View style={styles.groupPickerContainer}>
            <Picker
              testID="groupPicker"
              selectedValue={activeGroup.name}
              onValueChange={(groupName) => setActiveGroup(getGroup(groups, groupName.toString()))}
              style={styles.groupPicker}
            >
              {groups.map((group) => (
                <Picker.Item
                  key={group.name}
                  label={group.name}
                  value={group.name}
                />
              ))}
            </Picker>
          </View>
        )}
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

const prioritizeKoreanFieldworkGroup = (groups: Group[]): Group[] => {
  const koreanFieldworkGroup = groups.find((group) => group.name === KOREAN_FIELDWORK_GROUP_NAME);
  if (!koreanFieldworkGroup) return groups;

  return [
    koreanFieldworkGroup,
    ...groups.filter((group) => group.name !== KOREAN_FIELDWORK_GROUP_NAME),
  ];
};

const getGroup = (groups: Group[], groupName: string): Group =>
  groups.find((group) => group.name === groupName) ?? groups[0];

const styleGroupText = (group: Group, activeGroup: Group): TextStyle =>
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
  groupPickerContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    overflow: 'hidden',
  },
  groupPicker: {
    width: '100%',
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
