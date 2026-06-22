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
  getKoreanFieldworkNarrativeFieldGroups,
  getKoreanFieldworkNarrativeSnippetValue,
  KoreanFieldworkNarrativeFieldGroup,
  KoreanFieldworkNarrativeSnippet,
} from './korean-fieldwork-narrative-assist';

interface KoreanFieldworkNarrativeAssistPanelProps {
  category: CategoryForm;
  resource: NewResource;
  onUpdateResourceField: (fieldName: string, value: unknown) => void;
}

const KoreanFieldworkNarrativeAssistPanel: React.FC<
  KoreanFieldworkNarrativeAssistPanelProps
> = ({
  category,
  resource,
  onUpdateResourceField,
}) => {
  const groups = useMemo(
    () => getKoreanFieldworkNarrativeFieldGroups(category, resource),
    [category, resource]
  );

  if (groups.length === 0) return null;

  const applySnippet = (snippet: KoreanFieldworkNarrativeSnippet) => {
    onUpdateResourceField(
      snippet.target,
      getKoreanFieldworkNarrativeSnippetValue(resource, snippet)
    );
  };

  return (
    <View style={styles.container} testID="koreanFieldworkNarrativeAssistPanel">
      <View style={styles.headerTitleRow}>
        <MaterialIcons name="edit-note" size={18} color="#2f5f4a" />
        <Text style={styles.title}>서술 보조</Text>
      </View>

      {groups.map((group) => (
        <NarrativeFieldSection
          key={group.fieldName}
          group={group}
          onApplySnippet={applySnippet}
        />
      ))}
    </View>
  );
};

const NarrativeFieldSection: React.FC<{
  group: KoreanFieldworkNarrativeFieldGroup;
  onApplySnippet: (snippet: KoreanFieldworkNarrativeSnippet) => void;
}> = ({ group, onApplySnippet }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{group.label}</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.snippetRow}
    >
      {group.snippets.map((snippet) => (
        <SnippetButton
          key={snippet.id}
          snippet={snippet}
          onPress={() => onApplySnippet(snippet)}
        />
      ))}
    </ScrollView>
  </View>
);

const SnippetButton: React.FC<{
  snippet: KoreanFieldworkNarrativeSnippet;
  onPress: () => void;
}> = ({ snippet, onPress }) => (
  <TouchableOpacity
    accessibilityLabel={snippet.label}
    activeOpacity={0.84}
    onPress={onPress}
    style={styles.snippetButton}
    testID={`narrativeSnippet_${snippet.id}`}
  >
    <View style={styles.snippetIcon}>
      <MaterialIcons
        name={snippet.icon as keyof typeof MaterialIcons.glyphMap}
        size={17}
        color="#2f5f4a"
      />
    </View>
    <View style={styles.snippetTextWrap}>
      <Text style={styles.snippetLabel} numberOfLines={1}>
        {snippet.label}
      </Text>
      <Text style={styles.snippetDetail} numberOfLines={1}>
        {snippet.detail}
      </Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f3fbf6',
    borderColor: '#b7dcc8',
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
    color: '#2f5f4a',
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
  snippetRow: {
    paddingRight: 8,
  },
  snippetButton: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#b7dcc8',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 7,
    minHeight: 48,
    paddingHorizontal: 8,
    width: 178,
  },
  snippetIcon: {
    alignItems: 'center',
    backgroundColor: '#e6f4ec',
    borderRadius: 5,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  snippetTextWrap: {
    flex: 1,
    marginLeft: 7,
  },
  snippetLabel: {
    color: '#244d3c',
    fontSize: 12,
    fontWeight: '900',
  },
  snippetDetail: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});

export default KoreanFieldworkNarrativeAssistPanel;
