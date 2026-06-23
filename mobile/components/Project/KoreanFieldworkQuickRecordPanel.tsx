import { MaterialIcons } from '@expo/vector-icons';
import {
  CategoryForm,
  NewResource,
} from 'idai-field-core';
import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  FEATURE_STATUS_QUICK_OPTIONS,
  FIELDWORK_QUICK_FIELDS,
  getKoreanFieldworkChecklistQuickOptions,
  getKoreanFieldworkQuickRecordAvailability,
  getKoreanFieldworkQuickPresetUpdates,
  getKoreanFieldworkQuickPresets,
  getResourceFieldValue,
  getStringArrayFieldValues,
  hasKoreanFieldworkQuickRecordActions,
  KoreanFieldworkQuickOption,
  KoreanFieldworkQuickPreset,
  QUALITY_QUICK_OPTIONS,
  TIMING_QUICK_OPTIONS,
  toggleStringArrayFieldValue,
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

  if (!hasKoreanFieldworkQuickRecordActions(availability)) return null;

  const applyPreset = (preset: KoreanFieldworkQuickPreset) => {
    const updates = getKoreanFieldworkQuickPresetUpdates(
      resource,
      availability,
      preset.id,
      investigationModeId
    );

    if (Object.keys(updates).length === 0) return;

    if (onUpdateResourceFields) {
      onUpdateResourceFields(updates);
      return;
    }

    Object.entries(updates).forEach(([fieldName, value]) =>
      onUpdateResourceField(fieldName, value)
    );
  };

  return (
    <View style={styles.container} testID="koreanFieldworkQuickRecordPanel">
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <MaterialIcons name="fact-check" size={18} color="#175cd3" />
          <Text style={styles.title}>현장 빠른 입력</Text>
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

      {availability.featureStatus && (
        <QuickSection title="유구 진행">
          <OptionRow
            options={FEATURE_STATUS_QUICK_OPTIONS}
            activeValues={getSingleValue(resource, FIELDWORK_QUICK_FIELDS.featureStatus)}
            onPress={(value) => onUpdateResourceField(
              FIELDWORK_QUICK_FIELDS.featureStatus,
              value
            )}
            singleChoice
          />
        </QuickSection>
      )}

      {availability.checklist && (
        <QuickSection title="조사 과정표">
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

      {availability.quality && (
        <QuickSection title="기록 확인">
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
});

export default KoreanFieldworkQuickRecordPanel;
