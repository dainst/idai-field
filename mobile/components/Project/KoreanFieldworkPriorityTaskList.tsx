import { MaterialIcons } from '@expo/vector-icons';
import { Document } from 'idai-field-core';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '@/utils/colors';
import {
  KoreanFieldworkPriorityTask,
  KoreanFieldworkPriorityTaskTone,
} from './korean-fieldwork-today-actions';

interface KoreanFieldworkPriorityTaskListProps {
  tasks: KoreanFieldworkPriorityTask[];
  documentsById: Map<string, Document>;
  onAddDocumentOfCategory?: (parentDoc: Document, categoryName: string) => void;
  onOpenDocument: (document: Document) => void;
  onOpenMap?: () => void;
  title?: string;
}

const KoreanFieldworkPriorityTaskList: React.FC<KoreanFieldworkPriorityTaskListProps> = ({
  tasks,
  documentsById,
  onAddDocumentOfCategory,
  onOpenDocument,
  onOpenMap,
  title = '오늘 우선 작업',
}) => {
  if (tasks.length === 0) return null;

  const runTask = (task: KoreanFieldworkPriorityTask) => {
    switch (task.action.type) {
      case 'openDocument': {
        const document = documentsById.get(task.action.documentId);
        if (document) onOpenDocument(document);
        return;
      }
      case 'createDocument': {
        const parentDocument = documentsById.get(task.action.parentDocumentId);
        if (parentDocument && onAddDocumentOfCategory) {
          onAddDocumentOfCategory(parentDocument, task.action.categoryName);
        }
        return;
      }
      case 'openMap':
        onOpenMap?.();
        return;
    }
  };

  const isTaskDisabled = (task: KoreanFieldworkPriorityTask): boolean => {
    switch (task.action.type) {
      case 'openDocument':
        return !documentsById.has(task.action.documentId);
      case 'createDocument':
        return !onAddDocumentOfCategory
          || !documentsById.has(task.action.parentDocumentId);
      case 'openMap':
        return !onOpenMap;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <MaterialIcons name="checklist" size={18} color="#2f5f4a" />
        <Text style={styles.title}>{title}</Text>
      </View>
      {tasks.map((task) => {
        const disabled = isTaskDisabled(task);

        return (
          <TouchableOpacity
            key={task.id}
            activeOpacity={0.86}
            disabled={disabled}
            onPress={() => runTask(task)}
            style={[
              styles.taskRow,
              taskToneStyle(task.tone),
              disabled && styles.taskDisabled,
            ]}
          >
            <View style={[styles.taskIcon, taskIconToneStyle(task.tone)]}>
              <MaterialIcons
                name={task.icon as keyof typeof MaterialIcons.glyphMap}
                size={17}
                color={taskIconColor(task.tone)}
              />
            </View>
            <View style={styles.taskText}>
              <Text style={styles.taskTitle} numberOfLines={1}>
                {task.title}
              </Text>
              <Text style={styles.taskDetail} numberOfLines={2}>
                {task.detail}
              </Text>
            </View>
            {!disabled && (
              <MaterialIcons name="chevron-right" size={18} color="#667085" />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const taskToneStyle = (tone: KoreanFieldworkPriorityTaskTone) => {
  switch (tone) {
    case 'danger':
      return styles.taskDanger;
    case 'warning':
      return styles.taskWarning;
    case 'info':
      return styles.taskInfo;
    case 'success':
      return styles.taskSuccess;
    default:
      return styles.taskNeutral;
  }
};

const taskIconToneStyle = (tone: KoreanFieldworkPriorityTaskTone) => {
  switch (tone) {
    case 'danger':
      return styles.taskIconDanger;
    case 'warning':
      return styles.taskIconWarning;
    case 'info':
      return styles.taskIconInfo;
    case 'success':
      return styles.taskIconSuccess;
    default:
      return styles.taskIconNeutral;
  }
};

const taskIconColor = (tone: KoreanFieldworkPriorityTaskTone): string => {
  switch (tone) {
    case 'danger':
      return colors.danger;
    case 'warning':
      return '#b54708';
    case 'info':
      return '#175cd3';
    case 'success':
      return '#027a48';
    default:
      return '#475467';
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
  },
  title: {
    color: '#27343b',
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 5,
  },
  taskRow: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 5,
    minHeight: 52,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  taskNeutral: {
    borderColor: '#d0d5dd',
  },
  taskInfo: {
    borderColor: '#b2ddff',
  },
  taskSuccess: {
    borderColor: '#abefc6',
  },
  taskWarning: {
    borderColor: '#fedf89',
  },
  taskDanger: {
    borderColor: '#fecdca',
  },
  taskDisabled: {
    opacity: 0.55,
  },
  taskIcon: {
    alignItems: 'center',
    borderRadius: 5,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  taskIconNeutral: {
    backgroundColor: '#eef2f6',
  },
  taskIconInfo: {
    backgroundColor: '#eff8ff',
  },
  taskIconSuccess: {
    backgroundColor: '#ecfdf3',
  },
  taskIconWarning: {
    backgroundColor: '#fffaeb',
  },
  taskIconDanger: {
    backgroundColor: '#fff1f3',
  },
  taskText: {
    flex: 1,
    paddingHorizontal: 8,
  },
  taskTitle: {
    color: '#1f2937',
    fontSize: 13,
    fontWeight: '900',
  },
  taskDetail: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
});

export default KoreanFieldworkPriorityTaskList;
