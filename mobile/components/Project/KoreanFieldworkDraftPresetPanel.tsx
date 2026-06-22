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
  getKoreanFieldworkDraftPresets,
  KoreanFieldworkAvailableDraftPreset,
} from './korean-fieldwork-draft-presets';

interface KoreanFieldworkDraftPresetPanelProps {
  category: CategoryForm;
  resource: NewResource;
  onApplyPreset: (updates: Record<string, unknown>) => void;
}

const KoreanFieldworkDraftPresetPanel: React.FC<KoreanFieldworkDraftPresetPanelProps> = ({
  category,
  resource,
  onApplyPreset,
}) => {
  const presets = useMemo(
    () => getKoreanFieldworkDraftPresets(category, resource),
    [category, resource]
  );

  if (presets.length === 0) return null;

  return (
    <View style={styles.container} testID="koreanFieldworkDraftPresetPanel">
      <View style={styles.headerTitleRow}>
        <MaterialIcons name="view-quilt" size={18} color="#7a2e0e" />
        <Text style={styles.title}>기록 템플릿</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presetRow}
      >
        {presets.map((preset) => (
          <PresetButton
            key={preset.id}
            preset={preset}
            onPress={() => onApplyPreset(preset.updates)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const PresetButton: React.FC<{
  preset: KoreanFieldworkAvailableDraftPreset;
  onPress: () => void;
}> = ({ preset, onPress }) => (
  <TouchableOpacity
    accessibilityLabel={preset.label}
    activeOpacity={0.86}
    onPress={onPress}
    style={styles.presetButton}
    testID={`draftPreset_${preset.id}`}
  >
    <View style={styles.presetIcon}>
      <MaterialIcons
        name={preset.icon as keyof typeof MaterialIcons.glyphMap}
        size={18}
        color="#b54708"
      />
    </View>
    <View style={styles.presetTextWrap}>
      <Text style={styles.presetLabel} numberOfLines={1}>
        {preset.label}
      </Text>
      <Text style={styles.presetDetail} numberOfLines={2}>
        {preset.detail}
      </Text>
    </View>
    <Text style={styles.fieldCount}>
      {preset.fieldNames.length}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fffbeb',
    borderColor: '#fedf89',
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
    color: '#7a2e0e',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 5,
  },
  presetRow: {
    paddingRight: 8,
    paddingTop: 8,
  },
  presetButton: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#fdb022',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 8,
    minHeight: 56,
    paddingHorizontal: 8,
    width: 224,
  },
  presetIcon: {
    alignItems: 'center',
    backgroundColor: '#fef0c7',
    borderRadius: 5,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  presetTextWrap: {
    flex: 1,
    marginLeft: 8,
  },
  presetLabel: {
    color: '#1f2937',
    fontSize: 13,
    fontWeight: '900',
  },
  presetDetail: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 2,
  },
  fieldCount: {
    backgroundColor: '#fff7ed',
    borderRadius: 4,
    color: '#b54708',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 6,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
});

export default KoreanFieldworkDraftPresetPanel;
