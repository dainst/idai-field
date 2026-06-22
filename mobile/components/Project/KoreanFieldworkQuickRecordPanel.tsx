import { MaterialIcons } from '@expo/vector-icons';
import {
  CategoryForm,
  Resource,
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
  FEATURE_CHECKLIST_QUICK_OPTIONS,
  FIELDWORK_QUICK_FIELDS,
  getKoreanFieldworkQuickRecordAvailability,
  getResourceFieldValue,
  getStringArrayFieldValues,
  hasKoreanFieldworkQuickRecordActions,
  KoreanFieldworkQuickOption,
  QUALITY_QUICK_OPTIONS,
  TIMING_QUICK_OPTIONS,
  toggleStringArrayFieldValue,
  VERIFICATION_QUICK_OPTIONS,
} from './korean-fieldwork-quick-record';

interface KoreanFieldworkQuickRecordPanelProps {
  category: CategoryForm;
  resource: Resource;
  onUpdateResourceField: (fieldName: string, value: unknown) => void;
}

const KoreanFieldworkQuickRecordPanel: React.FC<KoreanFieldworkQuickRecordPanelProps> = ({
  category,
  resource,
  onUpdateResourceField,
}) => {
  const availability = useMemo(
    () => getKoreanFieldworkQuickRecordAvailability(category, resource),
    [category, resource]
  );

  if (!hasKoreanFieldworkQuickRecordActions(availability)) return null;

  return (
    <View style={styles.container} testID="koreanFieldworkQuickRecordPanel">
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <MaterialIcons name="fact-check" size={18} color="#175cd3" />
          <Text style={styles.title}>현장 점검</Text>
        </View>
      </View>

      {availability.checklist && (
        <QuickSection title="조사 과정표">
          <OptionRow
            options={FEATURE_CHECKLIST_QUICK_OPTIONS}
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
        <QuickSection title="품질 확인">
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
        <QuickSection title="검증 상태">
          <OptionRow
            options={VERIFICATION_QUICK_OPTIONS}
            activeValues={getSingleValue(resource, FIELDWORK_QUICK_FIELDS.verification)}
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
    </View>
  );
};

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
  resource: Resource,
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
