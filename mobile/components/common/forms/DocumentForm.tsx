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
import React, {
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '@/utils/colors';
import Button from '../Button';
import CategoryIcon from '../CategoryIcon';
import Heading from '../Heading';
import I18NLabel, { getKoreanFieldworkDisplayLabel } from '../I18NLabel';
import TitleBar from '../TitleBar';
import EditFormField from './EditFormField';
import LabelsContext from '@/contexts/labels/labels-context';
import {
  KOREAN_FIELDWORK_FEATURE_ATTRIBUTE_FIELD_NAMES,
} from '@/components/Project/korean-fieldwork-feature-attributes';
import {
  KOREAN_FIELDWORK_CATEGORY_ORDER,
} from '@/components/Project/korean-fieldwork-categories';

interface DocumentFormProps {
  category: CategoryForm;
  headerText: string;
  returnBtnHandler: () => void;
  titleBarRight: ReactNode;
  formHeader?: ReactNode;
  resourceActions?: ReactNode;
  collapseFormFieldsByDefault?: boolean;
  resource: Resource | NewResource | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateFunction: (key: string, value: any) => void;
}

const BTN_SIZE = 18;
const GROUP_PICKER_THRESHOLD = 6;
const AUXILIARY_RAW_GROUP_NAMES = new Set([
  'hierarchy',
  'workflow',
  'identification',
  'inventory',
]);
const KOREAN_FIELDWORK_MANAGED_CATEGORY_NAMES = new Set<string>(
  KOREAN_FIELDWORK_CATEGORY_ORDER
);
const KOREAN_FIELDWORK_PANEL_FIELD_NAMES = new Set([
  'description',
  'featureChecklistNote',
  'featureGeometryEditStatus',
  'featureGeometryReferenceLayerId',
  'featureGeometryRevisionHistory',
  'featureGeometryRevisionNote',
  'featureInvestigationChecklist',
  'featureInterpretationType',
  'featurePackage',
  'featureRecordingStatus',
  'featureSoilProfilePhotoCount',
  'featureType',
  'fieldIdentifier',
  'fieldRecordQuality',
  'firstExposureRecord',
  'foundationTraceRecord',
  'geometryConfidence',
  'geometrySource',
  'identifier',
  'identifierRevisionHistory',
  'identifierRevisionNote',
  'interpretation',
  'longAxisOrientation',
  'orientationNote',
  'orientationReference',
  'period',
  'pitDwellingExposureBaulk',
  'pitDwellingFireEvidence',
  'pitDwellingFloorFacility',
  'pitFeatureFunctionAssessment',
  'postholeGroupSurvey',
  'potteryKilnIdentification',
  'potteryKilnPartInvestigation',
  'potteryKilnStructureContext',
  'productionProcessSystem',
  'productionSiteAssociatedFacility',
  'recordCreationTiming',
  'reportIdentifier',
  'shortAxisOrientation',
  'shortDescription',
  'soilColorAssistCandidates',
  'soilColorAssistStatus',
  'soilColorCaptureCondition',
  'soilColorMoistureState',
  'soilColorMunsellManual',
  'soilColorNote',
  'soilColorReviewed',
  'soilColorRoi',
  'soilProfileCaptureNote',
  'soilProfileColorNote',
  'soilProfileColorSwatches',
  'surfaceBuildingJudgement',
  'tombBurialStructureInvestigation',
  'tombInteriorRecoveryRecord',
  'tombPassageClosureSequence',
  'verificationState',
  ...KOREAN_FIELDWORK_FEATURE_ATTRIBUTE_FIELD_NAMES,
]);
const KOREAN_FIELDWORK_MODE_TRIGGER_FIELD_NAMES = new Set([
  'featureChecklistNote',
  'featureGeometryEditStatus',
  'featureInvestigationChecklist',
  'featureInterpretationType',
  'featurePackage',
  'featureRecordingStatus',
  'featureSoilProfilePhotoCount',
  'featureType',
  'fieldIdentifier',
  'fieldRecordQuality',
  'firstExposureRecord',
  'geometryConfidence',
  'geometrySource',
  'longAxisOrientation',
  'period',
  'recordCreationTiming',
  'reportIdentifier',
  'soilColorAssistStatus',
  'verificationState',
  ...KOREAN_FIELDWORK_FEATURE_ATTRIBUTE_FIELD_NAMES,
]);

const DocumentForm: React.FC<DocumentFormProps> = ({
  category,
  headerText,
  returnBtnHandler,
  titleBarRight,
  formHeader,
  resourceActions,
  collapseFormFieldsByDefault = false,
  resource,
  updateFunction,
}) => {
  const { labels } = useContext(LabelsContext);
  const groups = useMemo(
    () => getVisibleRawGroups(category, resource),
    [category, resource]
  );
  const editableFieldCount = useMemo(() => getEditableFieldCount(groups), [groups]);
  const [activeGroup, setActiveGroup] = useState<Group | undefined>(groups[0]);
  const [areFormFieldsExpanded, setAreFormFieldsExpanded] = useState(
    !collapseFormFieldsByDefault
  );

  useEffect(() => setActiveGroup(groups[0]), [groups]);
  useEffect(
    () => setAreFormFieldsExpanded(!collapseFormFieldsByDefault),
    [category.name, collapseFormFieldsByDefault]
  );

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
      <FlatList
        contentContainerStyle={styles.formContent}
        data={areFormFieldsExpanded && activeGroup
          ? activeGroup.fields.filter(
          (fieldDef) => shouldShow(fieldDef) && resource
        )
          : []}
        keyExtractor={(field) => field.name}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={(
          <>
            {resourceActions && (
              <View style={styles.resourceActions}>
                {resourceActions}
              </View>
            )}
            {formHeader && (
              <View style={styles.formHeader}>
                {formHeader}
              </View>
            )}
            {editableFieldCount > 0 && (
              <View style={styles.formFieldsPanel}>
                <TouchableOpacity
                  onPress={() => setAreFormFieldsExpanded((expanded) => !expanded)}
                  style={styles.formFieldsToggle}
                  testID="fullFormToggle"
                >
                  <View style={styles.formFieldsToggleText}>
                    <Text style={styles.formFieldsTitle}>가져온 기존 항목</Text>
                    <Text style={styles.formFieldsSummary}>
                      {areFormFieldsExpanded
                        ? `기존 항목 ${editableFieldCount}개 확인 중`
                        : '필요할 때만 열기'}
                    </Text>
                  </View>
                  <Ionicons
                    name={areFormFieldsExpanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={colors.primary}
                  />
                </TouchableOpacity>
                {!areFormFieldsExpanded && (
                  <Text
                    style={styles.formFieldsCollapsedText}
                    testID="fullFormCollapsedSummary"
                  >
                    새 유구 기록은 위의 시대/시기·유구 성격·유구별 핵심 속성·야장 메모만 입력하면 충분합니다. 이 영역은 이전 양식에서 가져온 값이 있을 때만 확인합니다.
                  </Text>
                )}
                {areFormFieldsExpanded && (
                  <View
                    style={styles.groupsContainer}
                    testID="fullFormGroups"
                  >
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
                          selectedValue={activeGroup?.name}
                          onValueChange={(groupName) =>
                            setActiveGroup(getGroup(groups, groupName.toString()))}
                          style={styles.groupPicker}
                        >
                          {groups.map((group) => (
                            <Picker.Item
                              key={group.name}
                              label={getKoreanFieldworkDisplayLabel(
                                group,
                                labels?.get(group) ?? group.name
                              )}
                              value={group.name}
                            />
                          ))}
                        </Picker>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </>
        )}
        renderItem={({ item }) => (
          <EditFormField
            setFunction={updateFunction}
            field={item}
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            currentValue={resource![item.name]}
          />
        )}
        showsVerticalScrollIndicator={false}
        style={styles.formScroll}
      />
    </SafeAreaView>
  );
};

const shouldShow = (field: Field) =>
  field !== undefined && field.editable === true;

const hasEditableFields = (group: Group): boolean =>
  group.fields.some(shouldShow);

const prioritizeKoreanFieldworkGroup = (groups: Group[]): Group[] => {
  const koreanFieldworkGroup = groups.find((group) => group.name === KOREAN_FIELDWORK_GROUP_NAME);
  if (!koreanFieldworkGroup) return groups;

  return [
    koreanFieldworkGroup,
    ...groups.filter((group) => group.name !== KOREAN_FIELDWORK_GROUP_NAME),
  ];
};

const getVisibleRawGroups = (
  category: CategoryForm,
  resource: Resource | NewResource | undefined
): Group[] => {
  const hasKoreanFieldworkPanelFields = category.groups.some((group) =>
    group.fields.some((field) => KOREAN_FIELDWORK_MODE_TRIGGER_FIELD_NAMES.has(field.name))
  );
  const usesKoreanFieldworkGuidedForm =
    hasKoreanFieldworkPanelFields
    || KOREAN_FIELDWORK_MANAGED_CATEGORY_NAMES.has(category.name);

  return prioritizeKoreanFieldworkGroup(category.groups)
    .filter(shouldShowRawGroup)
    .map((group) => ({
      ...group,
      fields: group.fields.filter((field) =>
        shouldShowRawField(field, usesKoreanFieldworkGuidedForm)
        && (
          !usesKoreanFieldworkGuidedForm
          || rawFieldHasValue(field, resource)
        )
      ),
    }))
    .filter(hasEditableFields)
    .filter((group) =>
      !usesKoreanFieldworkGuidedForm
      || groupHasRawStorageValue(group, resource)
    );
};

const shouldShowRawGroup = (group: Group): boolean =>
  group.name === KOREAN_FIELDWORK_GROUP_NAME
  || !AUXILIARY_RAW_GROUP_NAMES.has(group.name);

const shouldShowRawField = (
  field: Field,
  hasKoreanFieldworkPanelFields: boolean
): boolean =>
  shouldShow(field)
  && (
    !hasKoreanFieldworkPanelFields
    || !KOREAN_FIELDWORK_PANEL_FIELD_NAMES.has(field.name)
  );

const getGroup = (groups: Group[], groupName: string): Group | undefined =>
  groups.find((group) => group.name === groupName) ?? groups[0];

const getEditableFieldCount = (groups: Group[]): number =>
  groups.reduce(
    (count, group) => count + group.fields.filter(shouldShow).length,
    0
  );

const groupHasRawStorageValue = (
  group: Group,
  resource: Resource | NewResource | undefined
): boolean => {
  if (!resource) return false;

  return group.fields.some((field) =>
    rawFieldHasValue(field, resource)
  );
};

const rawFieldHasValue = (
  field: Field,
  resource: Resource | NewResource | undefined
): boolean =>
  !!resource
  && (
    hasValue((resource as Record<string, unknown>)[field.name])
    || hasValue(resource.relations?.[field.name])
  );

const hasValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

const styleGroupText = (group: Group, activeGroup: Group | undefined): TextStyle =>
  group.name === activeGroup?.name
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
  resourceActions: {
    marginTop: 8,
  },
  formHeader: {
    marginHorizontal: 5,
    marginTop: 8,
  },
  formFieldsPanel: {
    borderColor: '#cbd7e3',
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 5,
    marginTop: 12,
    padding: 10,
  },
  formFieldsToggle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formFieldsToggleText: {
    flex: 1,
    paddingRight: 10,
  },
  formFieldsTitle: {
    color: '#24333f',
    fontSize: 18,
    fontWeight: '700',
  },
  formFieldsSummary: {
    color: '#526272',
    fontSize: 13,
    marginTop: 2,
  },
  formFieldsCollapsedText: {
    color: '#526272',
    fontSize: 13,
    marginTop: 10,
  },
  formContent: {
    paddingBottom: 36,
  },
  formScroll: {
    flex: 1,
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
