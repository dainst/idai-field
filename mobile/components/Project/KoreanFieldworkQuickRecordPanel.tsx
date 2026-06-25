import { MaterialIcons } from '@expo/vector-icons';
import {
  CategoryForm,
  NewResource,
} from 'idai-field-core';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getKoreanFieldworkFeatureAttributeGroups,
  getKoreanFieldworkFeatureAttributeUpdate,
  getKoreanFieldworkFeatureAttributeValues,
  getKoreanFieldworkFeatureObservationPlaceholder,
  KoreanFieldworkFeatureAttributeGroup,
} from './korean-fieldwork-feature-attributes';
import {
  FEATURE_STATUS_QUICK_OPTIONS,
  FEATURE_PERIOD_QUICK_OPTIONS,
  FEATURE_TYPE_QUICK_OPTIONS,
  FIELDWORK_QUICK_FIELDS,
  describeKoreanFieldworkLongAxisOrientation,
  getKoreanFieldworkFeatureTypeUpdates,
  getKoreanFieldworkChecklistQuickOptions,
  getKoreanFieldworkQuickRecordAvailability,
  getKoreanFieldworkQuickPresetUpdates,
  getKoreanFieldworkQuickPresets,
  getResourceFieldValue,
  getStringArrayFieldValues,
  hasKoreanFieldworkQuickRecordActions,
  isKoreanFieldworkLongAxisOrientation,
  KoreanFieldworkQuickOption,
  KoreanFieldworkQuickPreset,
  LONG_AXIS_ORIENTATION_QUICK_OPTIONS,
  normalizeKoreanFieldworkLongAxisOrientation,
  QUALITY_QUICK_OPTIONS,
  TIMING_QUICK_OPTIONS,
  toggleStringArrayFieldValue,
  VERIFICATION_QUICK_OPTIONS,
} from './korean-fieldwork-quick-record';
import { KoreanFieldworkInvestigationModeId } from './korean-fieldwork-investigation-mode';

interface KoreanFieldworkQuickRecordPanelProps {
  category: CategoryForm;
  investigationModeId?: KoreanFieldworkInvestigationModeId;
  resource: NewResource;
  onUpdateResourceField: (fieldName: string, value: unknown) => void;
  onUpdateResourceFields?: (updates: Record<string, unknown>) => void;
}

const KoreanFieldworkQuickRecordPanel: React.FC<KoreanFieldworkQuickRecordPanelProps> = ({
  category,
  investigationModeId,
  resource,
  onUpdateResourceField,
  onUpdateResourceFields,
}) => {
  const [showSecondaryFields, setShowSecondaryFields] = useState(false);
  const availability = useMemo(
    () => getKoreanFieldworkQuickRecordAvailability(
      category,
      resource,
      investigationModeId
    ),
    [category, investigationModeId, resource]
  );
  const presets = useMemo(
    () => getKoreanFieldworkQuickPresets(availability, investigationModeId),
    [availability, investigationModeId]
  );
  const checklistOptions = useMemo(
    () => getKoreanFieldworkChecklistQuickOptions(investigationModeId),
    [investigationModeId]
  );
  const categoryFieldNames = useMemo(
    () => new Set(category.groups.flatMap((group) =>
      group.fields.map((field) => field.name)
    )),
    [category]
  );
  const featureAttributeGroups = useMemo(
    () => getKoreanFieldworkFeatureAttributeGroups(category, resource),
    [category, resource]
  );
  const observationFieldName = getQuickObservationFieldName(
    categoryFieldNames
  );

  if (!hasKoreanFieldworkQuickRecordActions(availability) && !observationFieldName) return null;

  const applyUpdates = (updates: Record<string, unknown>) => {
    if (onUpdateResourceFields) {
      onUpdateResourceFields(updates);
      return;
    }

    Object.entries(updates).forEach(([fieldName, value]) =>
      onUpdateResourceField(fieldName, value)
    );
  };

  const applyPreset = (preset: KoreanFieldworkQuickPreset) => {
    const updates = getKoreanFieldworkQuickPresetUpdates(
      resource,
      availability,
      preset.id,
      investigationModeId
    );

    if (Object.keys(updates).length === 0) return;

    applyUpdates(updates);
  };

  const applyFeatureType = (value: string) => {
    applyUpdates({
      ...getKoreanFieldworkFeatureTypeUpdates(resource, value),
      ...getStaleFeatureAttributeClears(category, resource, value),
    });
  };

  const axisOrientationValue = getTextValue(
    resource,
    FIELDWORK_QUICK_FIELDS.longAxisOrientation
  );
  const orientationReferenceValue = getTextValue(
    resource,
    FIELDWORK_QUICK_FIELDS.orientationReference
  );
  const orientationNoteValue = getTextValue(
    resource,
    FIELDWORK_QUICK_FIELDS.orientationNote
  );
  const observationValue = observationFieldName
    ? getTextValue(resource, observationFieldName)
    : '';
  const observationPlaceholder = getKoreanFieldworkFeatureObservationPlaceholder(
    category,
    resource
  );
  const featureAttributeSectionTitle = getFeatureAttributeSectionTitle(
    getTextValue(resource, FIELDWORK_QUICK_FIELDS.featureType)
  );
  const panelTitle = getQuickRecordPanelTitle(
    availability.featureType,
    featureAttributeGroups.length > 0
  );
  const hasOrientationReference =
    categoryFieldNames.has(FIELDWORK_QUICK_FIELDS.orientationReference);
  const hasOrientationNote =
    categoryFieldNames.has(FIELDWORK_QUICK_FIELDS.orientationNote);
  const isAxisOrientationInvalid =
    axisOrientationValue.trim().length > 0
    && !isKoreanFieldworkLongAxisOrientation(axisOrientationValue);
  const axisOrientationHint =
    describeKoreanFieldworkLongAxisOrientation(axisOrientationValue)
    ?? '자북 기준 N-E = 북에서 동쪽으로 기운 장축';
  const hasPrimarySections =
    availability.period
    || availability.featureType
    || featureAttributeGroups.length > 0
    || !!observationFieldName
    || availability.axisOrientation
    || availability.checklist;
  const hasSecondarySections =
    availability.featureStatus
    || availability.quality
    || availability.verification
    || availability.timing;
  const secondarySectionCount = [
    availability.featureStatus,
    availability.quality,
    availability.verification,
    availability.timing,
  ].filter(Boolean).length;
  const shouldShowSecondaryFields = !hasPrimarySections || showSecondaryFields;

  return (
    <View style={styles.container} testID="koreanFieldworkQuickRecordPanel">
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <MaterialIcons name="fact-check" size={18} color="#175cd3" />
          <Text style={styles.title}>{panelTitle}</Text>
        </View>
      </View>

      {presets.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetRow}
        >
          {presets.map((preset) => (
            <PresetButton
              key={preset.id}
              preset={preset}
              onPress={() => applyPreset(preset)}
            />
          ))}
        </ScrollView>
      )}

      {availability.period && (
        <QuickSection title="시대/시기">
          <OptionRow
            options={FEATURE_PERIOD_QUICK_OPTIONS}
            activeValues={getSingleValue(resource, FIELDWORK_QUICK_FIELDS.period)}
            onPress={(value) => onUpdateResourceField(
              FIELDWORK_QUICK_FIELDS.period,
              value
            )}
            singleChoice
          />
        </QuickSection>
      )}

      {availability.featureType && (
        <QuickSection title="유구 성격">
          <OptionRow
            options={FEATURE_TYPE_QUICK_OPTIONS}
            activeValues={getSingleValue(resource, FIELDWORK_QUICK_FIELDS.featureType)}
            onPress={applyFeatureType}
            singleChoice
          />
        </QuickSection>
      )}

      {featureAttributeGroups.length > 0 && (
        <QuickSection title={featureAttributeSectionTitle}>
          {featureAttributeGroups.map((group) => (
            <FeatureAttributeGroup
              key={group.fieldName}
              group={group}
              activeValues={getKoreanFieldworkFeatureAttributeValues(
                resource,
                group.fieldName
              )}
              onPress={(value) => applyUpdates(
                getKoreanFieldworkFeatureAttributeUpdate(
                  resource,
                  group.fieldName,
                  value
                )
              )}
            />
          ))}
        </QuickSection>
      )}

      {observationFieldName && (
        <QuickSection title="야장 메모">
          <TextInput
            testID={`quickRecordInput_${observationFieldName}`}
            autoCorrect={false}
            multiline
            placeholder={observationPlaceholder}
            placeholderTextColor="#98a2b3"
            value={observationValue}
            onChangeText={(value) => onUpdateResourceField(
              observationFieldName,
              value
            )}
            style={[styles.textInput, styles.observationInput]}
          />
        </QuickSection>
      )}

      {availability.axisOrientation && (
        <QuickSection title="장축 방위">
          <TextInput
            testID="quickRecordInput_longAxisOrientation"
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="N-E 또는 N-23°-E"
            placeholderTextColor="#98a2b3"
            value={axisOrientationValue}
            onChangeText={(value) => onUpdateResourceField(
              FIELDWORK_QUICK_FIELDS.longAxisOrientation,
              value
            )}
            onEndEditing={(event) => {
              const normalizedValue = normalizeKoreanFieldworkLongAxisOrientation(
                event.nativeEvent.text
              );

              if (normalizedValue !== event.nativeEvent.text.trim()) {
                const updates: Record<string, unknown> = {
                  [FIELDWORK_QUICK_FIELDS.longAxisOrientation]: normalizedValue,
                };

                if (
                  hasOrientationReference
                  && !orientationReferenceValue.trim()
                  && isKoreanFieldworkLongAxisOrientation(normalizedValue)
                ) {
                  updates[FIELDWORK_QUICK_FIELDS.orientationReference] = '자북';
                }

                applyUpdates(updates);
              } else if (
                hasOrientationReference
                && !orientationReferenceValue.trim()
                && isKoreanFieldworkLongAxisOrientation(normalizedValue)
              ) {
                onUpdateResourceField(
                  FIELDWORK_QUICK_FIELDS.orientationReference,
                  '자북'
                );
              }
            }}
            style={[
              styles.textInput,
              isAxisOrientationInvalid && styles.textInputInvalid,
            ]}
          />
          <View style={styles.axisOptionRow}>
            <OptionRow
              options={LONG_AXIS_ORIENTATION_QUICK_OPTIONS}
              activeValues={getActiveAxisOrientationQuickValues(
                resource,
                FIELDWORK_QUICK_FIELDS.longAxisOrientation
              )}
              onPress={(value) => {
                const updates: Record<string, unknown> = {
                  [FIELDWORK_QUICK_FIELDS.longAxisOrientation]: value,
                };

                if (hasOrientationReference && !orientationReferenceValue.trim()) {
                  updates[FIELDWORK_QUICK_FIELDS.orientationReference] = '자북';
                }

                applyUpdates(updates);
              }}
              singleChoice
            />
          </View>
          <Text
            style={[
              styles.axisHint,
              isAxisOrientationInvalid && styles.axisHintInvalid,
            ]}
          >
            {isAxisOrientationInvalid
              ? '자북 기준 예: N-E, N-23°-E, 북에서 동쪽으로 23도'
              : axisOrientationHint}
          </Text>
          {hasOrientationNote && (
            <>
              <Text style={styles.inlineLabel}>방위 메모</Text>
              <TextInput
                testID="quickRecordInput_orientationNote"
                autoCorrect={false}
                multiline
                placeholder="재측정 필요, 나침반 흔들림, 현장 특이사항"
                placeholderTextColor="#98a2b3"
                value={orientationNoteValue}
                onChangeText={(value) => onUpdateResourceField(
                  FIELDWORK_QUICK_FIELDS.orientationNote,
                  value
                )}
                style={[styles.textInput, styles.noteInput]}
              />
            </>
          )}
        </QuickSection>
      )}

      {availability.checklist && (
        <QuickSection title="조사 단계 확인">
          <OptionRow
            options={checklistOptions}
            activeValues={getStringArrayFieldValues(
              resource,
              FIELDWORK_QUICK_FIELDS.checklist
            )}
            onPress={(value) => onUpdateResourceField(
              FIELDWORK_QUICK_FIELDS.checklist,
              toggleStringArrayFieldValue(
                resource,
                FIELDWORK_QUICK_FIELDS.checklist,
                value
              )
            )}
          />
        </QuickSection>
      )}

      {hasPrimarySections && hasSecondarySections && (
        <TouchableOpacity
          activeOpacity={0.84}
          onPress={() => setShowSecondaryFields((current) => !current)}
          style={styles.secondaryToggle}
          testID="quickRecordToggleSecondaryFields"
        >
          <View style={styles.secondaryToggleTitleRow}>
            <MaterialIcons name="tune" size={16} color="#475467" />
            <Text style={styles.secondaryToggleText}>
              {showSecondaryFields
                ? '추가 상태값 접기'
                : `추가 상태값 보기 (${secondarySectionCount})`}
            </Text>
          </View>
          <MaterialIcons
            name={showSecondaryFields ? 'expand-less' : 'expand-more'}
            size={19}
            color="#475467"
          />
        </TouchableOpacity>
      )}

      {shouldShowSecondaryFields && (
        <>
          {availability.featureStatus && (
            <QuickSection title="유구 진행">
              <OptionRow
                options={FEATURE_STATUS_QUICK_OPTIONS}
                activeValues={getSingleValue(
                  resource,
                  FIELDWORK_QUICK_FIELDS.featureStatus
                )}
                onPress={(value) => onUpdateResourceField(
                  FIELDWORK_QUICK_FIELDS.featureStatus,
                  value
                )}
                singleChoice
              />
            </QuickSection>
          )}

          {availability.quality && (
            <QuickSection title="기록 구분">
              <OptionRow
                options={QUALITY_QUICK_OPTIONS}
                activeValues={getStringArrayFieldValues(
                  resource,
                  FIELDWORK_QUICK_FIELDS.quality
                )}
                onPress={(value) => onUpdateResourceField(
                  FIELDWORK_QUICK_FIELDS.quality,
                  toggleStringArrayFieldValue(
                    resource,
                    FIELDWORK_QUICK_FIELDS.quality,
                    value
                  )
                )}
              />
            </QuickSection>
          )}

          {availability.verification && (
            <QuickSection title="확인 상태">
              <OptionRow
                options={VERIFICATION_QUICK_OPTIONS}
                activeValues={getSingleValue(
                  resource,
                  FIELDWORK_QUICK_FIELDS.verification
                )}
                onPress={(value) => onUpdateResourceField(
                  FIELDWORK_QUICK_FIELDS.verification,
                  value
                )}
                singleChoice
              />
            </QuickSection>
          )}

          {availability.timing && (
            <QuickSection title="기록 시점">
              <OptionRow
                options={TIMING_QUICK_OPTIONS}
                activeValues={getSingleValue(resource, FIELDWORK_QUICK_FIELDS.timing)}
                onPress={(value) => onUpdateResourceField(
                  FIELDWORK_QUICK_FIELDS.timing,
                  value
                )}
                singleChoice
              />
            </QuickSection>
          )}
        </>
      )}
    </View>
  );
};

const PresetButton: React.FC<{
  preset: KoreanFieldworkQuickPreset;
  onPress: () => void;
}> = ({ preset, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.84}
    onPress={onPress}
    style={styles.presetButton}
    testID={`quickRecordPreset_${preset.id}`}
  >
    <MaterialIcons
      name={preset.icon as keyof typeof MaterialIcons.glyphMap}
      size={17}
      color="#175cd3"
    />
    <View style={styles.presetTextWrap}>
      <Text style={styles.presetLabel} numberOfLines={1}>
        {preset.label}
      </Text>
      <Text style={styles.presetDetail} numberOfLines={1}>
        {preset.detail}
      </Text>
    </View>
  </TouchableOpacity>
);

const QuickSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const OptionRow: React.FC<{
  options: readonly KoreanFieldworkQuickOption[];
  activeValues: string[];
  onPress: (value: string) => void;
  singleChoice?: boolean;
}> = ({
  options,
  activeValues,
  onPress,
  singleChoice = false,
}) => {
  const activeValueSet = new Set(activeValues);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.optionRow}
    >
      {options.map((option) => {
        const isActive = activeValueSet.has(option.value);

        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.84}
            testID={`quickRecordOption_${option.value}`}
            onPress={() => onPress(option.value)}
            style={[
              styles.optionChip,
              isActive && styles.optionChipActive,
              singleChoice && styles.optionChipSingle,
            ]}
          >
            <MaterialIcons
              name={isActive ? 'check-circle' : 'radio-button-unchecked'}
              size={15}
              color={isActive ? '#027a48' : '#667085'}
            />
            <Text
              style={[
                styles.optionChipText,
                isActive && styles.optionChipTextActive,
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const getSingleValue = (
  resource: NewResource,
  fieldName: string
): string[] => {
  const fieldValue = getResourceFieldValue(resource, fieldName);

  return typeof fieldValue === 'string' ? [fieldValue] : [];
};

const getActiveAxisOrientationQuickValues = (
  resource: NewResource,
  fieldName: string
): string[] => {
  const fieldValue = getResourceFieldValue(resource, fieldName);
  if (typeof fieldValue !== 'string') return [];

  const normalizedValue = normalizeKoreanFieldworkLongAxisOrientation(fieldValue);
  const quadrantValue = normalizedValue.replace(/-\d{1,3}°-/, '-');

  return LONG_AXIS_ORIENTATION_QUICK_OPTIONS.some((option) =>
    option.value === quadrantValue
  )
    ? [quadrantValue]
    : [];
};

const getStaleFeatureAttributeClears = (
  category: CategoryForm,
  resource: NewResource,
  nextFeatureType: string
): Record<string, unknown> => {
  const nextFieldNames = getFeatureAttributeFieldNames(
    category,
    resource,
    nextFeatureType
  );
  const updates: Record<string, unknown> = {};

  FEATURE_TYPE_QUICK_OPTIONS
    .flatMap((option) => getKoreanFieldworkFeatureAttributeGroups(
      category,
      { ...resource, featureType: option.value }
    ))
    .forEach((group) => {
      if (
        !nextFieldNames.has(group.fieldName)
        && Object.prototype.hasOwnProperty.call(resource, group.fieldName)
      ) {
        updates[group.fieldName] = undefined;
      }
    });

  return updates;
};

const getFeatureAttributeFieldNames = (
  category: CategoryForm,
  resource: NewResource,
  featureType: string
): Set<string> =>
  new Set(getKoreanFieldworkFeatureAttributeGroups(
    category,
    { ...resource, featureType }
  ).map((group) => group.fieldName));

const getFeatureAttributeSectionTitle = (featureType: string): string => {
  const option = FEATURE_TYPE_QUICK_OPTIONS.find((item) => item.value === featureType);

  return option?.label && option.value !== 'unknown'
    ? `${option.label} 핵심 속성`
    : '유구 핵심 속성';
};

const getQuickRecordPanelTitle = (
  canSelectFeatureType: boolean,
  hasFeatureAttributes: boolean
): string =>
  canSelectFeatureType || hasFeatureAttributes
    ? '유구 성격별 기록'
    : '현장 최소 기록';

const QUICK_OBSERVATION_FIELD_ORDER = [
  'description',
  'featureChecklistNote',
  'interpretation',
  'shortDescription',
] as const;

const getQuickObservationFieldName = (
  fieldNames: Set<string>
): string | undefined =>
  QUICK_OBSERVATION_FIELD_ORDER.find((fieldName) => fieldNames.has(fieldName));

const FeatureAttributeGroup: React.FC<{
  activeValues: string[];
  group: KoreanFieldworkFeatureAttributeGroup;
  onPress: (value: string) => void;
}> = ({
  activeValues,
  group,
  onPress,
}) => (
  <View style={styles.attributeGroup}>
    <Text style={styles.attributeGroupTitle}>{group.title}</Text>
    <OptionRow
      options={group.options}
      activeValues={activeValues}
      onPress={(value) => onPress(value)}
    />
  </View>
);

const getTextValue = (
  resource: NewResource,
  fieldName: string
): string => {
  const fieldValue = getResourceFieldValue(resource, fieldName);

  return typeof fieldValue === 'string' ? fieldValue : '';
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5fbff',
    borderColor: '#b9d9ea',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
  },
  headerTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  title: {
    color: '#175cd3',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 5,
  },
  presetRow: {
    paddingRight: 8,
    paddingTop: 9,
  },
  presetButton: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#b2ddff',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 7,
    minHeight: 45,
    paddingHorizontal: 9,
    width: 188,
  },
  presetTextWrap: {
    flex: 1,
    marginLeft: 6,
  },
  presetLabel: {
    color: '#175cd3',
    fontSize: 12,
    fontWeight: '900',
  },
  presetDetail: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 5,
  },
  attributeGroup: {
    marginBottom: 7,
  },
  attributeGroupTitle: {
    color: '#475467',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 5,
  },
  secondaryToggle: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
    minHeight: 36,
    paddingHorizontal: 9,
  },
  secondaryToggleTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  secondaryToggleText: {
    color: '#475467',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
  optionRow: {
    paddingRight: 8,
  },
  optionChip: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 6,
    minHeight: 32,
    paddingHorizontal: 8,
  },
  optionChipActive: {
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
  },
  optionChipSingle: {
    minWidth: 86,
  },
  optionChipText: {
    color: '#475467',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
  optionChipTextActive: {
    color: '#027a48',
  },
  axisHint: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },
  axisHintInvalid: {
    color: '#b42318',
  },
  axisOptionRow: {
    marginTop: 6,
  },
  inlineLabel: {
    color: '#344054',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 5,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    color: '#101828',
    fontSize: 13,
    fontWeight: '800',
    minHeight: 38,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  textInputInvalid: {
    borderColor: '#f04438',
  },
  noteInput: {
    fontWeight: '700',
    minHeight: 54,
    textAlignVertical: 'top',
  },
  observationInput: {
    fontWeight: '700',
    minHeight: 72,
    textAlignVertical: 'top',
  },
});

export default KoreanFieldworkQuickRecordPanel;
