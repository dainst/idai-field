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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  KOREAN_FIELDWORK_CATEGORIES,
} from './korean-fieldwork-categories';
import { extractMunsellCandidateOptions } from './soil-color-photo-assist';

interface KoreanFieldworkSoilColorPanelProps {
  category: CategoryForm;
  resource: NewResource;
  onUpdateResourceField: (fieldName: string, value: unknown) => void;
  onUpdateResourceFields?: (updates: Record<string, unknown>) => void;
}

interface SoilColorOption {
  value: string;
  label: string;
}

const C = KOREAN_FIELDWORK_CATEGORIES;

const SOIL_COLOR_FIELDS = {
  assistCandidates: 'soilColorAssistCandidates',
  assistStatus: 'soilColorAssistStatus',
  captureCondition: 'soilColorCaptureCondition',
  manualMunsell: 'soilColorMunsellManual',
  moistureState: 'soilColorMoistureState',
  profileCaptureNote: 'soilProfileCaptureNote',
  profileColorNote: 'soilProfileColorNote',
  profileColorSwatches: 'soilProfileColorSwatches',
  soilColorNote: 'soilColorNote',
} as const;

const MUNSELL_PRESETS: readonly SoilColorOption[] = [
  { value: '10YR 4/3', label: '10YR 4/3' },
  { value: '10YR 3/2', label: '10YR 3/2' },
  { value: '10YR 5/4', label: '10YR 5/4' },
  { value: '7.5YR 4/4', label: '7.5YR 4/4' },
  { value: '2.5Y 5/3', label: '2.5Y 5/3' },
];

const MOISTURE_OPTIONS: readonly SoilColorOption[] = [
  { value: 'dry', label: '건조' },
  { value: 'moist', label: '습윤' },
  { value: 'wet', label: '젖음' },
  { value: 'unclear', label: '불명확' },
];

const CAPTURE_CONDITION_OPTIONS: readonly SoilColorOption[] = [
  { value: 'naturalLight', label: '자연광' },
  { value: 'shade', label: '그늘' },
  { value: 'calibrationTargetUsed', label: '보정판' },
  { value: 'flash', label: '플래시' },
  { value: 'poorCondition', label: '조건 불량' },
];

const KoreanFieldworkSoilColorPanel: React.FC<KoreanFieldworkSoilColorPanelProps> = ({
  category,
  resource,
  onUpdateResourceField,
  onUpdateResourceFields,
}) => {
  const fieldNames = useMemo(
    () => new Set(category.groups.flatMap((group) =>
      group.fields.map((field) => field.name)
    )),
    [category]
  );
  const isLayer = resource.category === C.LAYER;
  const isSoilProfilePhoto = resource.category === C.SOIL_PROFILE_PHOTO;
  const canRecordLayerMunsell =
    isLayer && fieldNames.has(SOIL_COLOR_FIELDS.manualMunsell);
  const canRecordPhotoSwatches =
    isSoilProfilePhoto && fieldNames.has(SOIL_COLOR_FIELDS.profileColorSwatches);
  const hasCaptureCondition =
    fieldNames.has(SOIL_COLOR_FIELDS.captureCondition);
  const hasAssistCandidates =
    fieldNames.has(SOIL_COLOR_FIELDS.assistCandidates);
  const assistCandidateText = getTextValue(
    resource,
    SOIL_COLOR_FIELDS.assistCandidates
  );
  const assistCandidateOptions = extractMunsellCandidateOptions(
    assistCandidateText
  ).map((value) => ({ value, label: value }));

  if (!canRecordLayerMunsell && !canRecordPhotoSwatches) return null;

  const updateFields = (updates: Record<string, unknown>) => {
    if (onUpdateResourceFields) {
      onUpdateResourceFields(updates);
      return;
    }

    Object.entries(updates).forEach(([fieldName, value]) =>
      onUpdateResourceField(fieldName, value)
    );
  };

  const applyMunsellPreset = (value: string) => {
    if (canRecordLayerMunsell) {
      updateFields(getLayerMunsellUpdates(fieldNames, value));
      return;
    }

    if (canRecordPhotoSwatches) {
      updateFields({
        [SOIL_COLOR_FIELDS.profileColorSwatches]: appendNumberedMunsellValue(
          getTextValue(resource, SOIL_COLOR_FIELDS.profileColorSwatches),
          value
        ),
      });
    }
  };

  const applyAssistCandidate = (value: string) => {
    if (canRecordLayerMunsell) {
      updateFields(getLayerMunsellUpdates(fieldNames, value));
      return;
    }

    if (canRecordPhotoSwatches) {
      updateFields({
        [SOIL_COLOR_FIELDS.profileColorSwatches]: appendNumberedMunsellValue(
          getTextValue(resource, SOIL_COLOR_FIELDS.profileColorSwatches),
          value
        ),
        ...(fieldNames.has(SOIL_COLOR_FIELDS.assistStatus)
          ? { [SOIL_COLOR_FIELDS.assistStatus]: 'reviewed' }
          : {}),
      });
    }
  };

  return (
    <View style={styles.container} testID="koreanFieldworkSoilColorPanel">
      <View style={styles.headerTitleRow}>
        <MaterialIcons name="palette" size={18} color="#7a4b12" />
        <Text style={styles.title}>토색 빠른 기록</Text>
      </View>

      <QuickSection title="먼셀값">
        <PresetRow
          options={MUNSELL_PRESETS}
          activeValue={getTextValue(resource, SOIL_COLOR_FIELDS.manualMunsell)}
          onPress={applyMunsellPreset}
        />
        {canRecordLayerMunsell && (
          <TextInput
            autoCapitalize="characters"
            autoCorrect={false}
            onChangeText={(value) => updateFields(
              getLayerMunsellUpdates(fieldNames, value)
            )}
            placeholder="예: 10YR 4/3"
            placeholderTextColor="#98a2b3"
            style={styles.textInput}
            testID="soilColorInput_manualMunsell"
            value={getTextValue(resource, SOIL_COLOR_FIELDS.manualMunsell)}
          />
        )}
        {canRecordPhotoSwatches && (
          <TextInput
            autoCapitalize="characters"
            autoCorrect={false}
            multiline
            onChangeText={(value) => onUpdateResourceField(
              SOIL_COLOR_FIELDS.profileColorSwatches,
              value
            )}
            placeholder={'1: 10YR 4/3 갈색\n2: 10YR 3/2 암회갈색'}
            placeholderTextColor="#98a2b3"
            style={[styles.textInput, styles.swatchInput]}
            testID="soilColorInput_profileColorSwatches"
            value={getTextValue(resource, SOIL_COLOR_FIELDS.profileColorSwatches)}
          />
        )}
      </QuickSection>

      {hasAssistCandidates && (
        <QuickSection title="사진 판독 후보">
          <TextInput
            autoCapitalize="characters"
            autoCorrect={false}
            multiline
            onChangeText={(value) => updateFields(
              getAssistCandidateUpdates(fieldNames, value)
            )}
            placeholder="사진에서 읽은 먼셀 후보가 여기에 표시됩니다"
            placeholderTextColor="#98a2b3"
            style={[styles.textInput, styles.candidateInput]}
            testID="soilColorInput_assistCandidates"
            value={assistCandidateText}
          />
          {assistCandidateOptions.length > 0 && (
            <PresetRow
              options={assistCandidateOptions}
              activeValue={
                canRecordLayerMunsell
                  ? getTextValue(resource, SOIL_COLOR_FIELDS.manualMunsell)
                  : getTextValue(resource, SOIL_COLOR_FIELDS.profileColorSwatches)
              }
              onPress={applyAssistCandidate}
              testIDPrefix="soilColorCandidateOption"
            />
          )}
        </QuickSection>
      )}

      {isLayer && fieldNames.has(SOIL_COLOR_FIELDS.moistureState) && (
        <QuickSection title="수분 상태">
          <PresetRow
            options={MOISTURE_OPTIONS}
            activeValue={getTextValue(resource, SOIL_COLOR_FIELDS.moistureState)}
            onPress={(value) => onUpdateResourceField(
              SOIL_COLOR_FIELDS.moistureState,
              value
            )}
          />
        </QuickSection>
      )}

      {hasCaptureCondition && (
        <QuickSection title="촬영 조건">
          <PresetRow
            options={CAPTURE_CONDITION_OPTIONS}
            activeValue={getTextValue(resource, SOIL_COLOR_FIELDS.captureCondition)}
            onPress={(value) => onUpdateResourceField(
              SOIL_COLOR_FIELDS.captureCondition,
              value
            )}
          />
        </QuickSection>
      )}

      <QuickSection title="토색 메모">
        <TextInput
          autoCorrect={false}
          multiline
          onChangeText={(value) => onUpdateResourceField(
            canRecordLayerMunsell
              ? SOIL_COLOR_FIELDS.soilColorNote
              : SOIL_COLOR_FIELDS.profileColorNote,
            value
          )}
          placeholder="색 변화, 혼입물, 보정 필요 여부"
          placeholderTextColor="#98a2b3"
          style={[styles.textInput, styles.noteInput]}
          testID="soilColorInput_note"
          value={getTextValue(
            resource,
            canRecordLayerMunsell
              ? SOIL_COLOR_FIELDS.soilColorNote
              : SOIL_COLOR_FIELDS.profileColorNote
          )}
        />
      </QuickSection>

      {isSoilProfilePhoto && fieldNames.has(SOIL_COLOR_FIELDS.profileCaptureNote) && (
        <QuickSection title="사진 메모">
          <TextInput
            autoCorrect={false}
            multiline
            onChangeText={(value) => onUpdateResourceField(
              SOIL_COLOR_FIELDS.profileCaptureNote,
              value
            )}
            placeholder="촬영 방향, 그늘, 보정판 위치"
            placeholderTextColor="#98a2b3"
            style={[styles.textInput, styles.noteInput]}
            testID="soilColorInput_captureNote"
            value={getTextValue(resource, SOIL_COLOR_FIELDS.profileCaptureNote)}
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

const PresetRow: React.FC<{
  options: readonly SoilColorOption[];
  activeValue?: string;
  onPress: (value: string) => void;
  testIDPrefix?: string;
}> = ({ options, activeValue, onPress, testIDPrefix = 'soilColorOption' }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.optionRow}
  >
    {options.map((option) => {
      const isActive = activeValue === option.value;

      return (
        <TouchableOpacity
          activeOpacity={0.84}
          key={option.value}
          onPress={() => onPress(option.value)}
          style={[styles.optionChip, isActive && styles.optionChipActive]}
          testID={`${testIDPrefix}_${option.value}`}
        >
          <MaterialIcons
            name={isActive ? 'check-circle' : 'radio-button-unchecked'}
            size={15}
            color={isActive ? '#027a48' : '#667085'}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.optionChipText,
              isActive && styles.optionChipTextActive,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const getLayerMunsellUpdates = (
  fieldNames: Set<string>,
  value: string
): Record<string, unknown> => {
  const updates: Record<string, unknown> = {
    [SOIL_COLOR_FIELDS.manualMunsell]: value,
  };

  if (fieldNames.has(SOIL_COLOR_FIELDS.assistStatus)) {
    updates[SOIL_COLOR_FIELDS.assistStatus] =
      value.trim().length > 0 ? 'manualRecorded' : 'notRun';
  }

  return updates;
};

const getAssistCandidateUpdates = (
  fieldNames: Set<string>,
  value: string
): Record<string, unknown> => {
  const updates: Record<string, unknown> = {
    [SOIL_COLOR_FIELDS.assistCandidates]: value,
  };

  if (fieldNames.has(SOIL_COLOR_FIELDS.assistStatus)) {
    updates[SOIL_COLOR_FIELDS.assistStatus] =
      value.trim().length > 0 ? 'candidatesAvailable' : 'notRun';
  }

  return updates;
};

const appendNumberedMunsellValue = (
  currentValue: string,
  munsellValue: string
): string => {
  const lines = currentValue
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const nextNumber = lines.length + 1;

  return [...lines, `${nextNumber}: ${munsellValue}`].join('\n');
};

const getTextValue = (
  resource: NewResource,
  fieldName: string
): string => {
  const value = resource[fieldName];

  return typeof value === 'string' ? value : '';
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff8eb',
    borderColor: '#e7bf78',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  headerTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  title: {
    color: '#7a4b12',
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
  optionChipText: {
    color: '#475467',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
  optionChipTextActive: {
    color: '#027a48',
  },
  textInput: {
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    color: '#101828',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
    minHeight: 38,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  swatchInput: {
    fontWeight: '700',
    minHeight: 76,
    textAlignVertical: 'top',
  },
  candidateInput: {
    fontWeight: '700',
    minHeight: 82,
    textAlignVertical: 'top',
  },
  noteInput: {
    fontWeight: '700',
    minHeight: 54,
    textAlignVertical: 'top',
  },
});

export default KoreanFieldworkSoilColorPanel;
