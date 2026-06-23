import { MaterialIcons } from '@expo/vector-icons';
import { Document } from 'idai-field-core';
import React, { useMemo } from 'react';
import {
  ScrollView,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getKoreanFieldworkHierarchyLanes,
  KoreanFieldworkHierarchyItem,
  KoreanFieldworkHierarchyLane,
} from './korean-fieldwork-hierarchy';

interface KoreanFieldworkHierarchyBoardProps {
  documents: Document[];
  documentsById: Map<string, Document>;
  hierarchyPath: Document[];
  issueCountByDocumentId: Record<string, number>;
  onOpenDocument: (document: Document) => void;
  onDrillDown: (document: Document) => void;
  onAddChild: (document: Document) => void;
}

const KoreanFieldworkHierarchyBoard: React.FC<KoreanFieldworkHierarchyBoardProps> = ({
  documents,
  documentsById,
  hierarchyPath,
  issueCountByDocumentId,
  onOpenDocument,
  onDrillDown,
  onAddChild,
}) => {
  const currentParent = hierarchyPath[hierarchyPath.length - 1];
  const lanes = useMemo(
    () => getKoreanFieldworkHierarchyLanes(
      documents,
      documentsById,
      currentParent,
      issueCountByDocumentId
    ),
    [currentParent, documents, documentsById, issueCountByDocumentId]
  );
  const scopeLabel = currentParent
    ? currentParent.resource.identifier || currentParent.resource.id
    : '전체 조사자료';

  return (
    <View style={styles.container} testID="koreanFieldworkHierarchyBoard">
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.kicker}>조사 흐름</Text>
          <Text style={styles.title} numberOfLines={1}>
            {scopeLabel}
          </Text>
        </View>
        <Text style={styles.flowText} numberOfLines={1}>
          조사 방식에 맞춰 트렌치·유구·피트·토층을 이어갑니다
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.laneRow}
      >
        {lanes.map((lane) => (
          <HierarchyLane
            key={lane.categoryName}
            lane={lane}
            onOpenDocument={onOpenDocument}
            onDrillDown={onDrillDown}
            onAddChild={onAddChild}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const HierarchyLane: React.FC<{
  lane: KoreanFieldworkHierarchyLane;
  onOpenDocument: (document: Document) => void;
  onDrillDown: (document: Document) => void;
  onAddChild: (document: Document) => void;
}> = ({
  lane,
  onOpenDocument,
  onDrillDown,
  onAddChild,
}) => (
  <View style={styles.lane}>
    <View style={styles.laneHeader}>
      <Text style={styles.laneTitle} numberOfLines={1}>{lane.label}</Text>
      <Text style={styles.laneCount}>{lane.totalCount}</Text>
    </View>
    {lane.items.length === 0 ? (
      <View style={styles.emptyLane}>
        <Text style={styles.emptyLaneText}>아직 없음</Text>
      </View>
    ) : lane.items.map((item) => (
      <HierarchyItemRow
        key={item.document.resource.id}
        item={item}
        onOpenDocument={onOpenDocument}
        onDrillDown={onDrillDown}
        onAddChild={onAddChild}
      />
    ))}
    {lane.hiddenCount > 0 && (
      <Text style={styles.hiddenCount}>외 {lane.hiddenCount}건</Text>
    )}
  </View>
);

const HierarchyItemRow: React.FC<{
  item: KoreanFieldworkHierarchyItem;
  onOpenDocument: (document: Document) => void;
  onDrillDown: (document: Document) => void;
  onAddChild: (document: Document) => void;
}> = ({
  item,
  onOpenDocument,
  onDrillDown,
  onAddChild,
}) => {
  const identifier = item.document.resource.identifier || item.document.resource.id;

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={() => onOpenDocument(item.document)}
      style={[
        styles.itemRow,
        item.isCurrentScope && styles.itemRowActive,
      ]}
    >
      <View style={styles.itemMain}>
        <Text
          style={[
            styles.itemTitle,
            item.isCurrentScope && styles.itemTitleActive,
          ]}
          numberOfLines={1}
        >
          {identifier}
        </Text>
        {!!item.parentIdentifier && (
          <Text style={styles.itemMeta} numberOfLines={1}>
            상위 {item.parentIdentifier}
          </Text>
        )}
        <View style={styles.itemChipRow}>
          {item.childCount > 0 && (
            <SmallChip icon="account-tree" text={`${item.childCount}`} />
          )}
          {item.issueCount > 0 && (
            <SmallChip icon="priority-high" text={`${item.issueCount}`} warning />
          )}
        </View>
      </View>
      <View style={styles.itemActions}>
        <IconAction
          icon="account-tree"
          label={`${identifier} 하위 범위로 이동`}
          onPress={(event) => {
            event?.stopPropagation();
            onDrillDown(item.document);
          }}
        />
        <IconAction
          icon="add"
          label={`${identifier} 하위 기록 추가`}
          onPress={(event) => {
            event?.stopPropagation();
            onAddChild(item.document);
          }}
        />
      </View>
    </TouchableOpacity>
  );
};

const SmallChip: React.FC<{
  icon: keyof typeof MaterialIcons.glyphMap;
  text: string;
  warning?: boolean;
}> = ({ icon, text, warning = false }) => (
  <View style={[styles.smallChip, warning && styles.smallChipWarning]}>
    <MaterialIcons name={icon} size={11} color={warning ? '#b42318' : '#475467'} />
    <Text style={[styles.smallChipText, warning && styles.smallChipTextWarning]}>
      {text}
    </Text>
  </View>
);

const IconAction: React.FC<{
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: (event?: GestureResponderEvent) => void;
}> = ({ icon, label, onPress }) => (
  <TouchableOpacity
    accessibilityLabel={label}
    hitSlop={8}
    onPress={onPress}
    style={styles.iconAction}
  >
    <MaterialIcons name={icon} size={16} color="#475467" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5fbff',
    borderBottomColor: '#b9d9ea',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  titleWrap: {
    flex: 1,
    paddingRight: 8,
  },
  kicker: {
    color: '#175cd3',
    fontSize: 11,
    fontWeight: '900',
  },
  title: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  flowText: {
    color: '#475467',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
    maxWidth: 280,
  },
  laneRow: {
    paddingTop: 10,
  },
  lane: {
    backgroundColor: 'white',
    borderColor: '#d6e9f4',
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 158,
    padding: 8,
    width: 184,
  },
  laneHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
  },
  laneTitle: {
    color: '#24333d',
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    paddingRight: 6,
  },
  laneCount: {
    backgroundColor: '#e0f2fe',
    borderRadius: 6,
    color: '#175cd3',
    fontSize: 11,
    fontWeight: '900',
    minWidth: 24,
    overflow: 'hidden',
    paddingHorizontal: 5,
    paddingVertical: 2,
    textAlign: 'center',
  },
  emptyLane: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#e4e7ec',
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  emptyLaneText: {
    color: '#98a2b3',
    fontSize: 12,
    fontWeight: '800',
  },
  itemRow: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 6,
    minHeight: 48,
    paddingLeft: 8,
    paddingRight: 5,
    paddingVertical: 6,
  },
  itemRowActive: {
    backgroundColor: '#eff8ff',
    borderColor: '#84caff',
  },
  itemMain: {
    flex: 1,
    paddingRight: 5,
  },
  itemTitle: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
  },
  itemTitleActive: {
    color: '#175cd3',
  },
  itemMeta: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  itemChipRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  smallChip: {
    alignItems: 'center',
    backgroundColor: '#f2f4f7',
    borderRadius: 5,
    flexDirection: 'row',
    marginRight: 4,
    minHeight: 18,
    paddingHorizontal: 4,
  },
  smallChipWarning: {
    backgroundColor: '#fff1f3',
  },
  smallChipText: {
    color: '#475467',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 2,
  },
  smallChipTextWarning: {
    color: '#b42318',
  },
  itemActions: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconAction: {
    alignItems: 'center',
    borderRadius: 6,
    height: 28,
    justifyContent: 'center',
    marginLeft: 2,
    width: 28,
  },
  hiddenCount: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 1,
  },
});

export default KoreanFieldworkHierarchyBoard;
