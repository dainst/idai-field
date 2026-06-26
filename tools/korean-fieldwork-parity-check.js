#!/usr/bin/env node

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const reportOnly = process.argv.includes('--report');

const featureRows = [
  {
    id: 'project-setup',
    title: 'Project setup: mode, boundary, operator',
    tablet: [
      'mobile/components/Home/CreateProjectModal.tsx',
      'mobile/components/Home/CreateProjectModal.spec.tsx',
      'mobile/app/(tabs)/SettingsScreen.tsx',
      'mobile/test/screens/SettingsScreen.spec.tsx',
      'mobile/hooks/use-korean-fieldwork-project-setup-defaults.ts',
      'mobile/hooks/use-korean-fieldwork-project-setup-defaults.spec.ts',
      'mobile/components/Project/korean-fieldwork-investigation-mode.ts'
    ],
    desktop: [
      'desktop/src/app/components/project/create-project-modal.component.ts',
      'desktop/test/unit/components/project/create-project-modal.component.spec.ts',
      'desktop/src/app/components/project/project-information-modal.component.ts',
      'desktop/test/unit/components/project/project-information-modal.component.spec.ts',
      'desktop/src/app/components/settings/settings.component.ts',
      'desktop/src/app/components/settings/settings.html',
      'desktop/src/app/components/settings/settings.scss',
      'desktop/test/unit/components/settings/settings.component.spec.ts',
      'desktop/src/app/util/korean-fieldwork-project-setup.ts'
    ],
    tabletTests: [
      'mobile/components/Home/CreateProjectModal.spec.tsx',
      'mobile/components/Home/project-name-validation.spec.ts',
      'mobile/test/screens/SettingsScreen.spec.tsx',
      'mobile/hooks/use-korean-fieldwork-project-setup-defaults.spec.ts'
    ],
    desktopTests: [
      'desktop/test/unit/components/project/create-project-modal.component.spec.ts',
      'desktop/test/unit/components/project/project-information-modal.component.spec.ts',
      'desktop/test/unit/components/settings/settings.component.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-project-setup.spec.ts'
    ]
  },
  {
    id: 'map-provider-setup',
    title: 'Map provider keys and satellite boundary readiness',
    tablet: [
      'mobile/app/(tabs)/SettingsScreen.tsx',
      'mobile/components/Project/Map/korean-fieldwork-map-provider-status.ts',
      'mobile/components/Project/Map/korean-fieldwork-map-start-panel.ts',
      'mobile/hooks/use-preferences.ts',
      'mobile/models/preferences.ts'
    ],
    desktop: [
      'desktop/src/app/components/settings/settings.component.ts',
      'desktop/src/app/components/settings/settings.html',
      'desktop/src/app/components/settings/settings.scss',
      'desktop/src/app/services/settings/settings.ts',
      'desktop/src/app/services/settings/settings-provider.ts',
      'desktop/src/app/services/settings/settings-serializer.ts',
      'desktop/src/app/util/korean-fieldwork-map-provider-settings.ts',
      'desktop/electron/main.js'
    ],
    tabletTests: [
      'mobile/test/screens/SettingsScreen.spec.tsx',
      'mobile/components/Project/Map/korean-fieldwork-map-provider-status.spec.ts',
      'mobile/components/Project/Map/korean-fieldwork-map-start-panel.spec.ts',
      'mobile/hooks/use-preferences.spec.ts'
    ],
    desktopTests: [
      'desktop/test/unit/components/settings/settings.component.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-map-provider-settings.spec.ts'
    ]
  },
  {
    id: 'guided-feature-recording',
    title: 'Guided feature recording: period, type, attributes',
    tablet: [
      'mobile/components/Project/KoreanFieldworkQuickRecordPanel.tsx',
      'mobile/components/Project/korean-fieldwork-quick-record.ts',
      'mobile/components/Project/korean-fieldwork-feature-attributes.ts'
    ],
    desktop: [
      'desktop/src/app/components/docedit/core/korean-fieldwork-quick-record-panel.component.ts',
      'desktop/src/app/components/docedit/core/korean-fieldwork-feature-guidance-panel.component.ts',
      'desktop/src/app/util/korean-fieldwork-feature-guidance.ts'
    ],
    tabletTests: [
      'mobile/components/Project/KoreanFieldworkQuickRecordPanel.spec.tsx',
      'mobile/components/Project/korean-fieldwork-quick-record.spec.ts',
      'mobile/components/Project/korean-fieldwork-feature-attributes.spec.ts'
    ],
    desktopTests: [
      'desktop/test/unit/components/docedit/core/korean-fieldwork-quick-record-panel.component.spec.ts',
      'desktop/test/unit/components/docedit/core/korean-fieldwork-feature-guidance-panel.component.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-feature-guidance.spec.ts'
    ]
  },
  {
    id: 'orientation',
    title: 'Orientation: long-axis bearing and reference',
    tablet: [
      'mobile/components/Project/KoreanFieldworkQuickRecordPanel.tsx',
      'mobile/components/Project/korean-fieldwork-quick-record.ts'
    ],
    desktop: [
      'desktop/src/app/components/docedit/core/korean-fieldwork-orientation-panel.component.ts',
      'desktop/src/app/util/korean-fieldwork-feature-guidance.ts'
    ],
    tabletTests: [
      'mobile/components/Project/KoreanFieldworkQuickRecordPanel.spec.tsx',
      'mobile/components/Project/korean-fieldwork-quick-record.spec.ts'
    ],
    desktopTests: [
      'desktop/test/unit/components/docedit/core/korean-fieldwork-orientation-panel.component.spec.ts'
    ]
  },
  {
    id: 'soil-color',
    title: 'Soil profile photo and Munsell review',
    tablet: [
      'mobile/components/Project/SoilProfileCameraButton.tsx',
      'mobile/components/Project/KoreanFieldworkSoilColorPanel.tsx',
      'mobile/components/Project/soil-color-photo-assist.ts'
    ],
    desktop: [
      'desktop/src/app/components/docedit/core/korean-fieldwork-soil-color-panel.component.ts',
      'desktop/src/app/util/korean-fieldwork-soil-color-candidates.ts',
      'desktop/src/app/util/korean-fieldwork-soil-color-photo-assist.ts'
    ],
    tabletTests: [
      'mobile/components/Project/SoilProfileCameraButton.spec.ts',
      'mobile/components/Project/KoreanFieldworkSoilColorPanel.spec.tsx',
      'mobile/components/Project/soil-color-photo-assist.spec.ts'
    ],
    desktopTests: [
      'desktop/test/unit/components/docedit/core/korean-fieldwork-soil-color-panel.component.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-soil-color-candidates.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-soil-color-photo-assist.spec.ts'
    ]
  },
  {
    id: 'selected-record-workbench',
    title: 'Selected record workbench and identifier revision',
    tablet: [
      'mobile/components/Project/KoreanFieldworkSelectedRecordWorkbench.tsx',
      'mobile/components/Project/korean-fieldwork-record-evidence.ts',
      'mobile/components/Project/korean-fieldwork-workbench.ts',
      'mobile/components/Project/korean-fieldwork-identifier-revision.ts'
    ],
    desktop: [
      'desktop/src/app/components/resources/korean-fieldwork-priority-strip.component.ts',
      'desktop/src/app/util/korean-fieldwork-record-evidence.ts',
      'desktop/src/app/util/korean-fieldwork-workbench.ts',
      'desktop/src/app/util/korean-fieldwork-identifier-revision.ts'
    ],
    tabletTests: [
      'mobile/components/Project/KoreanFieldworkSelectedRecordWorkbench.spec.tsx',
      'mobile/components/Project/korean-fieldwork-record-evidence.spec.ts',
      'mobile/components/Project/korean-fieldwork-workbench.spec.ts',
      'mobile/components/Project/korean-fieldwork-identifier-revision.spec.ts'
    ],
    desktopTests: [
      'desktop/test/unit/components/resources/korean-fieldwork-priority-strip.component.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-record-evidence.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-workbench.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-identifier-revision.spec.ts'
    ]
  },
  {
    id: 'daily-notebook',
    title: 'Daily notebook, follow-up notes, and narrative assist',
    tablet: [
      'mobile/components/Project/KoreanFieldworkFieldNotePanel.tsx',
      'mobile/components/Project/KoreanFieldworkNotebookLedger.tsx',
      'mobile/components/Project/KoreanFieldworkDailyNotebookDigest.tsx',
      'mobile/components/Project/korean-fieldwork-field-note-drafts.ts',
      'mobile/components/Project/korean-fieldwork-field-notes.ts',
      'mobile/components/Project/korean-fieldwork-handwriting.ts',
      'mobile/components/Project/korean-fieldwork-stylus-input.ts'
    ],
    desktop: [
      'desktop/src/app/components/docedit/core/korean-fieldwork-narrative-assist-panel.component.ts',
      'desktop/src/app/util/korean-fieldwork-evidence-review.ts',
      'desktop/src/app/util/korean-fieldwork-notebook-digest.ts',
      'desktop/src/app/util/korean-fieldwork-narrative-assist.ts'
    ],
    tabletTests: [
      'mobile/components/Project/KoreanFieldworkFieldNotePanel.spec.tsx',
      'mobile/components/Project/KoreanFieldworkNotebookLedger.spec.tsx',
      'mobile/components/Project/KoreanFieldworkDailyNotebookDigest.spec.tsx',
      'mobile/components/Project/korean-fieldwork-field-note-drafts.spec.ts',
      'mobile/components/Project/korean-fieldwork-field-notes.spec.ts',
      'mobile/components/Project/korean-fieldwork-handwriting.spec.ts',
      'mobile/components/Project/korean-fieldwork-stylus-input.spec.ts',
      'mobile/components/Project/korean-fieldwork-narrative-assist.spec.ts'
    ],
    desktopTests: [
      'desktop/test/unit/components/docedit/core/korean-fieldwork-narrative-assist-panel.component.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-evidence-review.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-notebook-digest.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-narrative-assist.spec.ts'
    ]
  },
  {
    id: 'progress-closeout',
    title: 'Progress board, hierarchy lanes, unit matrix, and closeout',
    tablet: [
      'mobile/components/Project/KoreanFieldworkHierarchyBoard.tsx',
      'mobile/components/Project/korean-fieldwork-hierarchy.ts',
      'mobile/components/Project/KoreanFieldworkProgressBoard.tsx',
      'mobile/components/Project/KoreanFieldworkUnitMatrix.tsx',
      'mobile/components/Project/korean-fieldwork-closeout.ts'
    ],
    desktop: [
      'desktop/src/app/util/korean-fieldwork-hierarchy.ts',
      'desktop/src/app/util/korean-fieldwork-progress-board.ts',
      'desktop/src/app/util/korean-fieldwork-unit-matrix.ts',
      'desktop/src/app/util/korean-fieldwork-closeout.ts'
    ],
    tabletTests: [
      'mobile/components/Project/KoreanFieldworkHierarchyBoard.spec.tsx',
      'mobile/components/Project/korean-fieldwork-hierarchy.spec.ts',
      'mobile/components/Project/KoreanFieldworkProgressBoard.spec.tsx',
      'mobile/components/Project/KoreanFieldworkUnitMatrix.spec.tsx',
      'mobile/components/Project/korean-fieldwork-progress.spec.ts',
      'mobile/components/Project/korean-fieldwork-unit-matrix.spec.ts',
      'mobile/components/Project/korean-fieldwork-closeout.spec.ts',
      'mobile/components/Project/korean-fieldwork-closeout-actions.spec.ts'
    ],
    desktopTests: [
      'desktop/test/unit/util/korean-fieldwork-hierarchy.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-progress-board.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-unit-matrix.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-closeout.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-closeout-actions.spec.ts'
    ]
  },
  {
    id: 'scope-workflow',
    title: 'Scope summary, today actions, and workflow steps',
    tablet: [
      'mobile/components/Project/KoreanFieldworkInvestigationModePanel.tsx',
      'mobile/components/Project/KoreanFieldworkScopePanel.tsx',
      'mobile/components/Project/KoreanFieldworkTodayBoard.tsx',
      'mobile/components/Project/Map/korean-fieldwork-map-start-panel.ts',
      'mobile/components/Project/korean-fieldwork-today-actions.ts'
    ],
    desktop: [
      'desktop/src/app/components/resources/korean-fieldwork-priority-strip.component.ts',
      'desktop/src/app/components/resources/korean-fieldwork-priority-strip.html',
      'desktop/src/app/util/korean-fieldwork-boundary-import-guidance.ts',
      'desktop/src/app/util/korean-fieldwork-boundary-summary.ts',
      'desktop/src/app/util/korean-fieldwork-operation-wrap.ts',
      'desktop/src/app/util/korean-fieldwork-workflow.ts',
      'desktop/src/app/util/korean-fieldwork-scope-summary.ts',
      'desktop/src/app/util/korean-fieldwork-today-actions.ts'
    ],
    tabletTests: [
      'mobile/components/Project/KoreanFieldworkInvestigationModePanel.spec.tsx',
      'mobile/components/Project/KoreanFieldworkScopePanel.spec.tsx',
      'mobile/components/Project/KoreanFieldworkTodayBoard.spec.tsx',
      'mobile/components/Project/Map/korean-fieldwork-map-start-panel.spec.ts',
      'mobile/components/Project/korean-fieldwork-scope.spec.ts',
      'mobile/components/Project/korean-fieldwork-today-actions.spec.ts'
    ],
    desktopTests: [
      'desktop/test/unit/components/resources/korean-fieldwork-priority-strip.component.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-boundary-summary.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-operation-wrap.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-workflow.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-scope-summary.spec.ts',
      'desktop/test/unit/util/korean-fieldwork-today-actions.spec.ts'
    ]
  },
  {
    id: 'compat-raw-fields',
    title: 'Compatibility raw fields stay secondary',
    tablet: [
      'mobile/components/common/forms/DocumentForm.tsx',
      'mobile/components/common/forms/DocumentForm.spec.tsx'
    ],
    desktop: [
      'desktop/src/app/components/docedit/core/edit-form.component.ts',
      'desktop/src/app/components/docedit/core/edit-form.html',
      'desktop/src/app/components/docedit/core/edit-form.scss',
      'desktop/test/unit/components/docedit/core/edit-form.component.spec.ts'
    ],
    tabletTests: [
      'mobile/components/common/forms/DocumentForm.spec.tsx'
    ],
    desktopTests: [
      'desktop/test/unit/components/docedit/core/edit-form.component.spec.ts'
    ]
  }
];

const releaseCriticalPatterns = [
  /^tools\/korean-fieldwork-(media-contract-check|parity-check|verify)\.js$/,
  /^core\/src\/datastore\/image\/(field-hub-file-url|image-sync-service)\.ts$/,
  /^core\/test\/datastore\/image\/(field-hub-file-url|image-sync-service)\.spec\.ts$/,
  /^core\/src\/datastore\/pouchdb\/(index|sync-service)\.ts$/,
  /^core\/test\/datastore\/pouchdb\/sync-service\.spec\.ts$/,
  /^core\/src\/model\/document\/image-document\.ts$/,
  /^core\/test\/model\/image-document\.spec\.ts$/,
  /^mobile\/app\/\(tabs\)\/ProjectScreen\/Document(Add|Edit)\.tsx$/,
  /^mobile\/app\/\(tabs\)\/ProjectScreen\/index\.tsx$/,
  /^mobile\/app\/\(tabs\)\/SettingsScreen\.tsx$/,
  /^mobile\/components\/Home\/CreateProjectModal(\.spec)?\.tsx$/,
  /^mobile\/components\/Home\/LoadProjectModal\.spec\.tsx$/,
  /^mobile\/components\/Home\/project-name-validation(\.spec)?\.ts$/,
  /^mobile\/components\/Project\/KoreanFieldwork.*\.(ts|tsx)$/,
  /^mobile\/components\/Project\/SoilProfileCameraButton(\.spec)?\.tsx?$/,
  /^mobile\/components\/Project\/Map\/korean-fieldwork-map-(provider-status|start-panel)(\.spec)?\.ts$/,
  /^mobile\/components\/Project\/korean-fieldwork-.*\.(ts|tsx)$/,
  /^mobile\/components\/Project\/soil-color-photo-assist(\.spec)?\.ts$/,
  /^mobile\/components\/common\/forms\/DocumentForm(\.spec)?\.tsx$/,
  /^mobile\/contexts\/project-context(\.spec)?\.tsx$/,
  /^mobile\/hooks\/use-(fieldwork-image-sync|preferences|search|sync)(\.spec)?\.ts$/,
  /^mobile\/hooks\/use-korean-fieldwork-project-setup-defaults(\.spec)?\.ts$/,
  /^mobile\/models\/project-settings(\.spec)?\.ts$/,
  /^mobile\/test\/screens\/.*\.spec\.tsx$/,
  /^desktop\/src\/app\/components\/docedit\/core\/edit-form\.(component\.ts|html|scss)$/,
  /^desktop\/src\/app\/components\/docedit\/core\/korean-fieldwork-.*\.(ts|html|scss)$/,
  /^desktop\/test\/unit\/components\/docedit\/core\/edit-form\.component\.spec\.ts$/,
  /^desktop\/src\/app\/components\/project\/(create-project-modal|project-information-modal)\.component\.(ts|html|scss)$/,
  /^desktop\/src\/app\/components\/project\/create-project-modal\.html$/,
  /^desktop\/src\/app\/components\/project\/download-project\.component\.(ts|html|scss)$/,
  /^desktop\/src\/app\/components\/settings\/settings\.(component\.)?(ts|html|scss)$/,
  /^desktop\/src\/app\/components\/image\/export\/image-export-modal\.component\.ts$/,
  /^desktop\/src\/app\/components\/image\/grid\/construct-grid\.ts$/,
  /^desktop\/src\/app\/services\/imagestore\/(export-images|image-tool-launcher|image-url-maker|remote-image-store)\.ts$/,
  /^desktop\/src\/app\/services\/imagestore\/manipulation\/(jimp|sharp)\/.*display-variant-creation\.ts$/,
  /^desktop\/src\/app\/services\/express-server\/express-server\.ts$/,
  /^desktop\/src\/app\/services\/settings\/settings(-provider|-serializer)?\.ts$/,
  /^desktop\/electron\/main\.js$/,
  /^desktop\/test\/unit\/components\/images\/grid\/construct-grid\.spec\.ts$/,
  /^desktop\/test\/unit\/services\/express-server\.spec\.ts$/,
  /^desktop\/test\/unit\/services\/imagestore\/(export-images|image-tool-launcher|image-url-maker|remote-image-store)\.spec\.ts$/,
  /^desktop\/test\/unit\/components\/project\/(create-project-modal|download-project|project-information-modal)\.component\.spec\.ts$/,
  /^desktop\/test\/unit\/components\/settings\/settings\.component\.spec\.ts$/,
  /^desktop\/src\/app\/components\/resources\/korean-fieldwork-priority-strip(\.component)?\.(ts|html|scss)$/,
  /^desktop\/src\/app\/util\/korean-fieldwork-.*\.ts$/,
  /^desktop\/test\/unit\/components\/docedit\/core\/korean-fieldwork-.*\.spec\.ts$/,
  /^desktop\/test\/unit\/components\/resources\/korean-fieldwork-priority-strip\.component\.spec\.ts$/,
  /^desktop\/test\/unit\/util\/korean-fieldwork-.*\.spec\.ts$/,
  /^server\/lib\/field_hub\/(cli|file_store|project)\.ex$/,
  /^server\/lib\/field_hub_web\/live\/project_(create|show)\.(ex|html\.heex)$/,
  /^server\/lib\/field_hub_web\/rest\/api\/(file|project)\.ex$/,
  /^server\/test\/field_hub\/(cli|file_store|project)_test\.exs$/,
  /^server\/test\/field_hub_web\/controllers\/api\/(file|project)_controller_test\.exs$/,
  /^server\/test\/field_hub_web\/live\/project_(create|show)_live_test\.exs$/
];

const classifiedSupportSourceGroups = [
  {
    reason: 'desktop docedit panel template and style companions',
    files: [
      'desktop/src/app/components/docedit/core/korean-fieldwork-draft-preset-panel.html',
      'desktop/src/app/components/docedit/core/korean-fieldwork-draft-preset-panel.scss',
      'desktop/src/app/components/docedit/core/korean-fieldwork-feature-guidance-panel.html',
      'desktop/src/app/components/docedit/core/korean-fieldwork-feature-guidance-panel.scss',
      'desktop/src/app/components/docedit/core/korean-fieldwork-narrative-assist-panel.html',
      'desktop/src/app/components/docedit/core/korean-fieldwork-narrative-assist-panel.scss',
      'desktop/src/app/components/docedit/core/korean-fieldwork-orientation-panel.html',
      'desktop/src/app/components/docedit/core/korean-fieldwork-orientation-panel.scss',
      'desktop/src/app/components/docedit/core/korean-fieldwork-quick-record-panel.html',
      'desktop/src/app/components/docedit/core/korean-fieldwork-quick-record-panel.scss',
      'desktop/src/app/components/docedit/core/korean-fieldwork-readiness-panel.html',
      'desktop/src/app/components/docedit/core/korean-fieldwork-readiness-panel.scss',
      'desktop/src/app/components/docedit/core/korean-fieldwork-record-context-panel.html',
      'desktop/src/app/components/docedit/core/korean-fieldwork-record-context-panel.scss',
      'desktop/src/app/components/docedit/core/korean-fieldwork-soil-color-panel.html',
      'desktop/src/app/components/docedit/core/korean-fieldwork-soil-color-panel.scss'
    ]
  },
  {
    reason: 'desktop support panels embedded in the fieldwork edit flow',
    files: [
      'desktop/src/app/components/docedit/core/korean-fieldwork-draft-preset-panel.component.ts',
      'desktop/src/app/components/docedit/core/korean-fieldwork-readiness-panel.component.ts',
      'desktop/src/app/components/docedit/core/korean-fieldwork-record-context-panel.component.ts'
    ]
  },
  {
    reason: 'desktop project and resource view templates/styles for feature-row components',
    files: [
      'desktop/src/app/components/project/create-project-modal.html',
      'desktop/src/app/components/project/create-project-modal.scss',
      'desktop/src/app/components/project/project-information-modal.html',
      'desktop/src/app/components/project/project-information-modal.scss',
      'desktop/src/app/components/resources/korean-fieldwork-priority-strip.html',
      'desktop/src/app/components/resources/korean-fieldwork-priority-strip.scss'
    ]
  },
  {
    reason: 'release verification tooling that keeps tablet and desktop fieldwork flows aligned',
    files: [
      'tools/korean-fieldwork-media-contract-check.js',
      'tools/korean-fieldwork-parity-check.js',
      'tools/korean-fieldwork-verify.js'
    ]
  },
  {
    reason: 'desktop local Field Hub-compatible file API bridge coverage for tablet uploads',
    files: [
      'desktop/src/app/services/express-server/express-server.ts',
      'desktop/test/unit/services/express-server.spec.ts'
    ]
  },
  {
    reason: 'desktop image export handover manifests for later report preparation',
    files: [
      'desktop/src/app/components/image/export/image-export-modal.component.ts',
      'desktop/src/app/services/imagestore/export-images.ts',
      'desktop/test/unit/services/imagestore/export-images.spec.ts'
    ]
  },
  {
    reason: 'desktop shared utilities consumed by feature-row panels',
    files: [
      'desktop/src/app/util/korean-fieldwork-closeout-actions.ts',
      'desktop/src/app/util/korean-fieldwork-document-drafts.ts',
      'desktop/src/app/util/korean-fieldwork-draft-defaults.ts',
      'desktop/src/app/util/korean-fieldwork-draft-presets.ts',
      'desktop/src/app/util/korean-fieldwork-issue-resolution.ts',
      'desktop/src/app/util/korean-fieldwork-record-actions.ts',
      'desktop/src/app/util/korean-fieldwork-record-work-filters.ts',
      'desktop/src/app/util/korean-fieldwork-today-stats.ts'
    ]
  },
  {
    reason: 'tablet project screen that composes fieldwork panels and closeout summaries',
    files: [
      'mobile/app/(tabs)/ProjectScreen/DocumentAdd.tsx',
      'mobile/app/(tabs)/ProjectScreen/DocumentEdit.tsx',
      'mobile/app/(tabs)/ProjectScreen/index.tsx'
    ]
  },
  {
    reason: 'tablet support panels composed into the project workbench',
    files: [
      'mobile/components/Project/KoreanFieldworkDraftContextPanel.tsx',
      'mobile/components/Project/KoreanFieldworkDraftContinuationPanel.tsx',
      'mobile/components/Project/KoreanFieldworkDraftPresetPanel.tsx',
      'mobile/components/Project/KoreanFieldworkHierarchyBoard.tsx',
      'mobile/components/Project/KoreanFieldworkNarrativeAssistPanel.tsx',
      'mobile/components/Project/KoreanFieldworkPriorityTaskList.tsx',
      'mobile/components/Project/KoreanFieldworkRecordActionPanel.tsx',
      'mobile/components/Project/KoreanFieldworkRecordContextPanel.tsx',
      'mobile/components/Project/KoreanFieldworkWorkbenchPanel.tsx'
    ]
  },
  {
    reason: 'tablet shared utilities consumed by feature-row panels',
    files: [
      'mobile/components/Project/Map/korean-fieldwork-drafts.ts',
      'mobile/components/Project/korean-fieldwork-add-options.ts',
      'mobile/components/Project/korean-fieldwork-categories.ts',
      'mobile/components/Project/korean-fieldwork-child-records.ts',
      'mobile/components/Project/korean-fieldwork-closeout-actions.ts',
      'mobile/components/Project/korean-fieldwork-document-drafts.ts',
      'mobile/components/Project/korean-fieldwork-draft-continuation.ts',
      'mobile/components/Project/korean-fieldwork-draft-presets.ts',
      'mobile/components/Project/korean-fieldwork-feature-types.ts',
      'mobile/components/Project/korean-fieldwork-hierarchy.ts',
      'mobile/components/Project/korean-fieldwork-issue-resolution.ts',
      'mobile/components/Project/korean-fieldwork-narrative-assist.ts',
      'mobile/components/Project/korean-fieldwork-navigation.ts',
      'mobile/components/Project/korean-fieldwork-operation-wrap.ts',
      'mobile/components/Project/korean-fieldwork-progress.ts',
      'mobile/components/Project/korean-fieldwork-project-setup-sync.ts',
      'mobile/components/Project/korean-fieldwork-record-actions.ts',
      'mobile/components/Project/korean-fieldwork-record-list-empty-state.ts',
      'mobile/components/Project/korean-fieldwork-record-summary.ts',
      'mobile/components/Project/korean-fieldwork-record-work-filters.ts',
      'mobile/components/Project/korean-fieldwork-scope.ts',
      'mobile/components/Project/korean-fieldwork-unit-matrix.ts'
    ]
  }
];

const classifiedSupportSources = classifiedSupportSourceGroups
  .flatMap((group) => group.files);

const sourceInventoryPatterns = [
  /^mobile\/app\/\(tabs\)\/ProjectScreen\/Document(Add|Edit)\.tsx$/,
  /^mobile\/app\/\(tabs\)\/ProjectScreen\/index\.tsx$/,
  /^mobile\/app\/\(tabs\)\/SettingsScreen\.tsx$/,
  /^mobile\/components\/Home\/CreateProjectModal\.tsx$/,
  /^mobile\/components\/Project\/KoreanFieldwork.*\.tsx$/,
  /^mobile\/components\/Project\/korean-fieldwork-.*\.ts$/,
  /^mobile\/components\/Project\/soil-color-photo-assist\.ts$/,
  /^mobile\/components\/Project\/SoilProfileCameraButton\.tsx$/,
  /^mobile\/components\/Project\/Map\/korean-fieldwork-drafts\.ts$/,
  /^mobile\/components\/Project\/Map\/korean-fieldwork-map-(provider-status|start-panel)\.ts$/,
  /^mobile\/components\/common\/forms\/DocumentForm\.tsx$/,
  /^mobile\/hooks\/use-korean-fieldwork-project-setup-defaults\.ts$/,
  /^desktop\/src\/app\/components\/docedit\/core\/edit-form\.(component\.ts|html|scss)$/,
  /^desktop\/src\/app\/components\/docedit\/core\/korean-fieldwork-.*\.(ts|html|scss)$/,
  /^desktop\/src\/app\/components\/project\/(create-project-modal|project-information-modal)\.(component\.ts|html|scss)$/,
  /^desktop\/src\/app\/components\/settings\/settings\.(component\.ts|html|scss)$/,
  /^desktop\/src\/app\/components\/resources\/korean-fieldwork-priority-strip\.(component\.ts|html|scss)$/,
  /^desktop\/src\/app\/util\/korean-fieldwork-.*\.ts$/,
  /^tools\/korean-fieldwork-(media-contract-check|parity-check|verify)\.js$/
];

const sharedPriorityTaskIds = [
  'start-operation',
  'create-daily-log',
  'create-survey-boundary',
  'create-trench',
  'create-trench-profile-photo',
  'create-detected-feature',
  'create-trench-pit',
  'create-pit-profile-photo',
  'create-trench-photo',
  'create-pre-investigation-photo',
  'create-excavation-section',
  'create-excavation-profile-photo',
  'create-excavation-drawing'
];

const missing = [];
const missingCoverage = [];

for (const row of featureRows) {
  const missingTablet = row.tablet.filter((filePath) => !exists(filePath));
  const missingDesktop = row.desktop.filter((filePath) => !exists(filePath));
  const missingTabletTests = row.tabletTests.filter((filePath) => !exists(filePath));
  const missingDesktopTests = row.desktopTests.filter((filePath) => !exists(filePath));

  if (missingTablet.length > 0 || missingDesktop.length > 0) {
    missing.push({ row, missingTablet, missingDesktop });
  }

  if (missingTabletTests.length > 0 || missingDesktopTests.length > 0) {
    missingCoverage.push({ row, missingTabletTests, missingDesktopTests });
  }
}

const gitStatusEntries = getGitStatusEntries();
const untrackedCriticalFiles = gitStatusEntries
  .filter((entry) => entry.indexStatus === '?' && entry.worktreeStatus === '?')
  .map((entry) => entry.filePath)
  .filter(isReleaseCriticalFile)
  .sort();
const unstagedCriticalFiles = gitStatusEntries
  .filter((entry) => entry.indexStatus !== '?' && entry.worktreeStatus !== ' ')
  .map((entry) => entry.filePath)
  .filter(isReleaseCriticalFile)
  .sort();
const investigationModeFindings = compareInvestigationModes();
const guidedFeatureFindings = [
  ...compareGuidedFeatureTypes(),
  ...compareGuidedFeatureAttributes(),
  ...validateGuidedFeatureDraftDefaults()
];
const guidedFeatureConfigFindings = validateGuidedFeatureConfig();
const projectStartSequenceFindings = validateProjectStartSequence();
const projectSettingsFindings = validateProjectSettingsCompleteness();
const projectInvestigationModeWordingFindings = validateProjectInvestigationModeWording();
const priorityTaskFindings = validatePriorityTaskIds();
const rawFormFindings = validateRawFormFieldRules();
const recordPanelOrderFindings = validateRecordPanelOrder();
const connectedRecordWordingFindings = validateConnectedRecordWording();
const scopeMetricWordingFindings = validateScopeMetricWording();
const soilColorReviewFindings = validateSoilColorReviewWorkflow();
const progressModeFindings = validateProgressModeAwareness();
const recordActionFindings = validateRecordActionEvidencePriority();
const recordEmptyStateFindings = validateRecordEmptyStateGuidance();
const verificationCoverageFindings = validateFieldworkVerificationCoverage();
const sourceInventoryFindings = findUnclassifiedSourceFiles();
const supportInventoryFindings = validateSupportSourceGroups();

printReport(
  missing,
  missingCoverage,
  untrackedCriticalFiles,
  unstagedCriticalFiles,
  investigationModeFindings,
  guidedFeatureFindings,
  guidedFeatureConfigFindings,
  projectStartSequenceFindings,
  projectSettingsFindings,
  projectInvestigationModeWordingFindings,
  priorityTaskFindings,
  rawFormFindings,
  recordPanelOrderFindings,
  connectedRecordWordingFindings,
  scopeMetricWordingFindings,
  soilColorReviewFindings,
  progressModeFindings,
  recordActionFindings,
  recordEmptyStateFindings,
  verificationCoverageFindings,
  sourceInventoryFindings,
  supportInventoryFindings
);

if (
  !reportOnly
  && (
    missing.length > 0
    || missingCoverage.length > 0
    || untrackedCriticalFiles.length > 0
    || unstagedCriticalFiles.length > 0
    || investigationModeFindings.length > 0
    || guidedFeatureFindings.length > 0
    || guidedFeatureConfigFindings.length > 0
    || projectStartSequenceFindings.length > 0
    || projectSettingsFindings.length > 0
    || projectInvestigationModeWordingFindings.length > 0
    || priorityTaskFindings.length > 0
    || rawFormFindings.length > 0
    || recordPanelOrderFindings.length > 0
    || connectedRecordWordingFindings.length > 0
    || scopeMetricWordingFindings.length > 0
    || soilColorReviewFindings.length > 0
    || progressModeFindings.length > 0
    || recordActionFindings.length > 0
    || recordEmptyStateFindings.length > 0
    || verificationCoverageFindings.length > 0
    || sourceInventoryFindings.length > 0
    || supportInventoryFindings.length > 0
  )
) {
  process.exitCode = 1;
}

function exists(filePath) {
  return fs.existsSync(path.join(repoRoot, filePath));
}

function validateFieldworkVerificationCoverage() {
  const findings = [];
  let selectedPaths;

  try {
    selectedPaths = JSON.parse(childProcess.execFileSync(
      process.execPath,
      ['tools/korean-fieldwork-verify.js', '--list-test-paths'],
      { cwd: repoRoot, encoding: 'utf8' }
    ));
  } catch (error) {
    findings.push(`unable to inspect Korean fieldwork verifier test paths: ${error.message}`);
    return findings;
  }

  const desktopTests = new Set(selectedPaths.desktop || []);
  const mobileTests = new Set(selectedPaths.mobile || []);

  for (const row of featureRows) {
    for (const filePath of row.desktopTests) {
      const verifierPath = filePath.replace(/^desktop\//, '');
      if (!desktopTests.has(verifierPath)) {
        findings.push(`default verifier desktop tests omit ${row.id}: ${filePath}`);
      }
    }

    for (const filePath of row.tabletTests) {
      const verifierPath = filePath.replace(/^mobile\//, '');
      if (!mobileTests.has(verifierPath)) {
        findings.push(`default verifier tablet tests omit ${row.id}: ${filePath}`);
      }
    }
  }

  if (readTextFile('package.json').includes('--all-fieldwork-tests')) {
    findings.push('package scripts still depend on legacy --all-fieldwork-tests flag');
  }

  return findings;
}

function getGitStatusEntries() {
  let output = '';
  try {
    output = childProcess.execFileSync(
      'git',
      ['status', '--porcelain=v1', '--untracked-files=all'],
      { cwd: repoRoot, encoding: 'utf8' }
    );
  } catch (error) {
    console.warn('WARN unable to inspect git status:', error.message);
    return [];
  }

  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseGitStatusLine)
    .filter((entry) => entry !== undefined);
}

function parseGitStatusLine(line) {
  const indexStatus = line[0];
  const worktreeStatus = line[1];
  const filePath = line.slice(3).split(' -> ').pop().replace(/\\/g, '/');

  if (!filePath) return undefined;

  return { indexStatus, worktreeStatus, filePath };
}

function isReleaseCriticalFile(filePath) {
  return releaseCriticalPatterns.some((pattern) => pattern.test(filePath));
}

function validateSupportSourceGroups() {
  const findings = [];
  const seen = new Set();

  for (const [index, group] of classifiedSupportSourceGroups.entries()) {
    if (!group.reason || group.reason.trim().length === 0) {
      findings.push(`support source group ${index + 1} has no reason`);
    }

    if (!Array.isArray(group.files) || group.files.length === 0) {
      findings.push(`support source group ${index + 1} has no files`);
      continue;
    }

    for (const filePath of group.files) {
      if (seen.has(filePath)) {
        findings.push(`support source is classified more than once: ${filePath}`);
      }
      seen.add(filePath);

      if (!exists(filePath)) {
        findings.push(`support source is classified but missing: ${filePath}`);
      }
    }
  }

  return findings;
}

function findUnclassifiedSourceFiles() {
  const registered = new Set([
    ...classifiedSupportSources,
    ...featureRows.flatMap((row) => [...row.tablet, ...row.desktop])
  ]);

  return getWatchedSourceFiles()
    .filter((filePath) => !registered.has(filePath))
    .sort();
}

function getWatchedSourceFiles() {
  return [
    ...walkRelative('mobile/app/(tabs)'),
    ...walkRelative('mobile/components/Home'),
    ...walkRelative('mobile/components/Project'),
    ...walkRelative('mobile/components/common/forms'),
    ...walkRelative('mobile/hooks'),
    ...walkRelative('desktop/src/app/components/docedit/core'),
    ...walkRelative('desktop/src/app/components/project'),
    ...walkRelative('desktop/src/app/components/settings'),
    ...walkRelative('desktop/src/app/components/resources'),
    ...walkRelative('desktop/src/app/util')
  ]
    .filter((filePath) => /\.(ts|tsx|html|scss)$/.test(filePath))
    .filter((filePath) => !/\.spec\./.test(filePath))
    .filter((filePath) => sourceInventoryPatterns.some((pattern) => pattern.test(filePath)));
}

function walkRelative(directory) {
  const absoluteDirectory = path.join(repoRoot, directory);
  if (!fs.existsSync(absoluteDirectory)) return [];

  return fs.readdirSync(absoluteDirectory, { withFileTypes: true })
    .flatMap((entry) => {
      const filePath = path.join(directory, entry.name).replace(/\\/g, '/');

      return entry.isDirectory()
        ? walkRelative(filePath)
        : [filePath];
    });
}

function compareInvestigationModes() {
  const tabletModes = extractInvestigationModeOptions(
    'mobile/components/Project/korean-fieldwork-investigation-mode.ts',
    'KOREAN_FIELDWORK_INVESTIGATION_MODES',
    'id'
  );
  const desktopModes = extractInvestigationModeOptions(
    'desktop/src/app/util/korean-fieldwork-project-setup.ts',
    'KOREAN_FIELDWORK_INVESTIGATION_MODES',
    'value'
  );
  const allModeIds = sortUnique([
    ...Object.keys(tabletModes),
    ...Object.keys(desktopModes)
  ]);
  const findings = [];

  for (const modeId of allModeIds) {
    const tabletMode = tabletModes[modeId];
    const desktopMode = desktopModes[modeId];

    if (!tabletMode) {
      findings.push(`tablet investigation mode missing for desktop mode: ${modeId}`);
      continue;
    }
    if (!desktopMode) {
      findings.push(`desktop investigation mode missing for tablet mode: ${modeId}`);
      continue;
    }

    for (const propertyName of ['label', 'detail']) {
      if (tabletMode[propertyName] !== desktopMode[propertyName]) {
        findings.push(
          [
            `investigation mode ${propertyName} mismatch for ${modeId}:`,
            `tablet=${tabletMode[propertyName] || '(none)'}`,
            `desktop=${desktopMode[propertyName] || '(none)'}`
          ].join(' ')
        );
      }
    }
  }

  return findings;
}

function extractInvestigationModeOptions(filePath, arrayName, idPropertyName) {
  const text = readTextFile(filePath);
  const result = {};

  for (const objectText of extractTopLevelArrayObjects(text, arrayName)) {
    const modeId = extractStringProperty(objectText, idPropertyName);
    if (!modeId) continue;

    result[modeId] = {
      label: extractStringProperty(objectText, 'label'),
      detail: extractStringProperty(objectText, 'detail')
    };
  }

  return result;
}

function compareGuidedFeatureTypes() {
  const tabletTypes = extractFeatureTypeOptions(
    'mobile/components/Project/korean-fieldwork-feature-types.ts',
    'KOREAN_FIELDWORK_FEATURE_TYPE_OPTIONS',
    'featureInterpretationTypeValue'
  );
  const desktopTypes = extractFeatureTypeOptions(
    'desktop/src/app/util/korean-fieldwork-feature-guidance.ts',
    'KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS',
    'interpretationValue'
  );
  const allTypes = sortUnique([
    ...Object.keys(tabletTypes),
    ...Object.keys(desktopTypes)
  ]);
  const findings = [];

  for (const featureType of allTypes) {
    if (!tabletTypes[featureType]) {
      findings.push(
        `tablet feature type missing for desktop preset: ${featureType}`
      );
      continue;
    }
    if (!desktopTypes[featureType]) {
      findings.push(
        `desktop feature preset missing for tablet type: ${featureType}`
      );
      continue;
    }

    const tabletInterpretation = tabletTypes[featureType].interpretationValue;
    const desktopInterpretation = desktopTypes[featureType].interpretationValue;
    if (tabletInterpretation !== desktopInterpretation) {
      findings.push(
        [
          `guided interpretation mismatch for ${featureType}:`,
          `tablet=${tabletInterpretation || '(none)'}`,
          `desktop=${desktopInterpretation || '(none)'}`
        ].join(' ')
      );
    }
  }

  return findings;
}

function compareGuidedFeatureAttributes() {
  const tabletAttributes = extractTabletFeatureAttributes();
  const desktopAttributes = extractDesktopFeatureAttributes();
  const tabletLabels = extractTabletFeatureAttributeLabels();
  const configLabels = extractGuidedFeatureConfigLabels();
  const allFeatureTypes = sortUnique([
    ...Object.keys(tabletAttributes),
    ...Object.keys(desktopAttributes)
  ]);
  const findings = [];

  for (const featureType of allFeatureTypes) {
    const tabletFields = tabletAttributes[featureType] || {};
    const desktopFields = desktopAttributes[featureType] || {};
    const allFields = sortUnique([
      ...Object.keys(tabletFields),
      ...Object.keys(desktopFields)
    ]);

    for (const fieldName of allFields) {
      const tabletValues = tabletFields[fieldName] || [];
      const desktopValues = desktopFields[fieldName] || [];
      const missingTabletValues = desktopValues
        .filter((valueId) => !tabletValues.includes(valueId));
      const missingDesktopValues = tabletValues
        .filter((valueId) => !desktopValues.includes(valueId));

      if (tabletValues.length === 0 && desktopValues.length > 0) {
        findings.push(
          `tablet guided attribute field missing for ${featureType}: ${fieldName}`
        );
      } else if (desktopValues.length === 0 && tabletValues.length > 0) {
        findings.push(
          `desktop guided attribute field missing for ${featureType}: ${fieldName}`
        );
      }

      for (const valueId of missingTabletValues) {
        findings.push(
          `tablet guided value missing for ${featureType}.${fieldName}: ${valueId}`
        );
      }
      for (const valueId of missingDesktopValues) {
        findings.push(
          `desktop guided value missing for ${featureType}.${fieldName}: ${valueId}`
        );
      }

      for (const valueId of tabletValues) {
        const tabletLabel = tabletLabels[featureType]?.[fieldName]?.[valueId];
        const configLabel = configLabels[fieldName]?.[valueId];

        if (!tabletLabel) {
          findings.push(
            `tablet guided display label missing for ${featureType}.${fieldName}: ${valueId}`
          );
          continue;
        }
        if (!configLabel) continue;

        if (!areCompatibleKoreanFieldworkDisplayLabels(tabletLabel, configLabel)) {
          findings.push(
            [
              `guided display label mismatch for ${featureType}.${fieldName}.${valueId}:`,
              `tablet=${tabletLabel}`,
              `config=${configLabel}`
            ].join(' ')
          );
        }
      }
    }
  }

  return findings;
}

function validateGuidedFeatureDraftDefaults() {
  const findings = [];
  const tabletDraftText = readTextFile('mobile/components/Project/korean-fieldwork-document-drafts.ts');
  const tabletQuickRecordText = readTextFile('mobile/components/Project/KoreanFieldworkQuickRecordPanel.tsx');
  const tabletRecordContextText = readTextFile('mobile/components/Project/KoreanFieldworkRecordContextPanel.tsx');
  const tabletFieldNoteText = readTextFile('mobile/components/Project/KoreanFieldworkFieldNotePanel.tsx');
  const tabletMapBottomSheetText = readTextFile('mobile/components/Project/Map/MapBottomSheet.tsx');
  const desktopDraftText = readTextFile('desktop/src/app/util/korean-fieldwork-document-drafts.ts');
  const desktopFeatureGuidanceTemplateText = readTextFile(
    'desktop/src/app/components/docedit/core/korean-fieldwork-feature-guidance-panel.html'
  );
  const desktopFeatureGuidanceComponentText = readTextFile(
    'desktop/src/app/components/docedit/core/korean-fieldwork-feature-guidance-panel.component.ts'
  );
  const desktopFeatureGuidanceUtilText = readTextFile(
    'desktop/src/app/util/korean-fieldwork-feature-guidance.ts'
  );
  const desktopQuickRecordText = readTextFile(
    'desktop/src/app/components/docedit/core/korean-fieldwork-quick-record-panel.component.ts'
  );
  const desktopQuickRecordSpecText = readTextFile(
    'desktop/test/unit/components/docedit/core/korean-fieldwork-quick-record-panel.component.spec.ts'
  );
  const tabletAddModalText = readTextFile('mobile/components/Project/DocumentAddModal.tsx');
  const desktopRecordContextText = readTextFile(
    'desktop/src/app/components/docedit/core/korean-fieldwork-record-context-panel.component.ts'
  );
  const desktopRecordContextTemplateText = readTextFile(
    'desktop/src/app/components/docedit/core/korean-fieldwork-record-context-panel.html'
  );
  const desktopPriorityStripText = readTextFile(
    'desktop/src/app/components/resources/korean-fieldwork-priority-strip.component.ts'
  );
  const desktopPriorityStripTemplateText = readTextFile(
    'desktop/src/app/components/resources/korean-fieldwork-priority-strip.html'
  );

  for (const [label, text] of [
    ['tablet', tabletDraftText],
    ['desktop', desktopDraftText]
  ]) {
    if (!text.includes('featureType?: string')) {
      findings.push(`${label} draft resource options do not accept featureType`);
    }
    if (!text.includes('options.featureType')) {
      findings.push(`${label} draft resource does not read featureType options`);
    }
    if (!text.includes('featureInterpretationType')) {
      findings.push(`${label} feature drafts do not seed feature interpretation type`);
    }
  }

  if (!desktopDraftText.includes("options.featureType ?? 'unknown'")) {
    findings.push('desktop feature drafts must default to unknown feature type');
  }
  if (!tabletAddModalText.includes('KOREAN_FIELDWORK_FEATURE_TYPE_OPTIONS')) {
    findings.push('tablet add flow does not expose feature type options before creating Feature records');
  }
  if (
    !tabletQuickRecordText.includes('getFeatureAttributeSectionTitle')
    || !tabletQuickRecordText.includes('핵심 속성')
  ) {
    findings.push('tablet guided feature panel must label type-specific attributes as core attributes');
  }
  if (
    !tabletQuickRecordText.includes('getKoreanFieldworkFeatureObservationPlaceholder')
    || !readTextFile('mobile/components/Project/korean-fieldwork-feature-attributes.ts')
        .includes('getKoreanFieldworkFeatureObservationPlaceholder')
  ) {
    findings.push('tablet guided feature panel must use feature-specific observation placeholders');
  }
  if (
    !readTextFile('mobile/components/Project/KoreanFieldworkQuickRecordPanel.spec.tsx')
      .includes('feature-specific placeholders')
    || !readTextFile('mobile/components/Project/korean-fieldwork-feature-attributes.spec.ts')
      .includes('type-specific observation placeholders')
  ) {
    findings.push('tablet guided feature panel tests must cover type-specific observation placeholders');
  }
  if (!tabletQuickRecordText.includes('유구 성격별 기록')) {
    findings.push('tablet guided feature panel must present feature-specific input as 유구 성격별 기록');
  }
  if (!hasOrderedSubstrings(tabletQuickRecordText, [
    'title="시대/시기"',
    'title="유구 성격"',
    'title={featureAttributeSectionTitle}'
  ])) {
    findings.push('tablet guided feature panel must keep 시대/시기 before 유구 성격 before 핵심 속성');
  }
  for (const source of [
    { label: 'tablet quick record', text: tabletQuickRecordText },
    { label: 'tablet field note', text: tabletFieldNoteText },
    { label: 'tablet map bottom sheet', text: tabletMapBottomSheetText }
  ]) {
    if (!source.text.includes('조사 단계 확인')) {
      findings.push(`${source.label} must label checklist input as 조사 단계 확인`);
    }
    if (source.text.includes('조사 흐름')) {
      findings.push(`${source.label} still labels checklist input as 조사 흐름`);
    }
  }
  if (!desktopFeatureGuidanceTemplateText.includes('유구 성격별 기록')) {
    findings.push('desktop guided feature panel must present feature-specific input as 유구 성격별 기록');
  }
  if (
    !desktopFeatureGuidanceComponentText.includes('getNarrativePlaceholder')
    || !desktopFeatureGuidanceTemplateText.includes('[placeholder]="getNarrativePlaceholder()"')
  ) {
    findings.push('desktop guided feature panel must expose selected feature templates as observation placeholders');
  }
  if (!desktopQuickRecordText.includes('조사 단계 확인')) {
    findings.push('desktop quick record panel must label checklist input as 조사 단계 확인');
  }
  if (!desktopQuickRecordText.includes('유구 진행')) {
    findings.push('desktop quick record panel must label feature status as 유구 진행');
  }
  if (!desktopQuickRecordSpecText.includes('field-facing labels')) {
    findings.push('desktop quick record panel test must cover field-facing labels');
  }
  if (!hasOrderedSubstrings(desktopFeatureGuidanceTemplateText, [
    'getPeriodFieldName()',
    'canSelectFeatureType()',
    'getCoreAttributeTitle'
  ])) {
    findings.push('desktop guided feature panel must keep 시대/시기 before 유구 성격 before 핵심 속성');
  }
  if (!readTextFile(
    'desktop/test/unit/components/docedit/core/korean-fieldwork-feature-guidance-panel.component.spec.ts'
  ).includes('field recording order')) {
    findings.push('desktop guided feature panel test must cover field recording order');
  }
  if (!readTextFile(
    'desktop/test/unit/components/docedit/core/korean-fieldwork-feature-guidance-panel.component.spec.ts'
  ).includes('observation placeholder')) {
    findings.push('desktop guided feature panel test must cover type-specific observation placeholders');
  }
  if (
    !desktopFeatureGuidanceTemplateText.includes('getCoreAttributeTitle')
    || !desktopFeatureGuidanceComponentText.includes('핵심 속성')
  ) {
    findings.push('desktop guided feature panel must label type-specific attributes as core attributes');
  }
  if (
    !desktopFeatureGuidanceUtilText.includes('getKoreanFieldworkFeatureGuidanceSelectedAttributeLabels')
    || !desktopFeatureGuidanceUtilText.includes("combustionPartRecorded: '연소부'")
    || !desktopRecordContextText.includes('getKoreanFieldworkFeatureGuidanceSelectedAttributeLabels')
    || !desktopRecordContextText.includes('핵심 속성 미기록')
  ) {
    findings.push('desktop opened-record context must summarize selected guided feature core attributes');
  }
  if (desktopFeatureGuidanceTemplateText.includes('유구 속성')) {
    findings.push('desktop guided feature panel still uses broad feature-attribute wording');
  }
  if (desktopFeatureGuidanceTemplateText.includes('세부 속성')) {
    findings.push('desktop guided feature panel still uses detail-form wording for type-specific attributes');
  }
  if (!desktopRecordContextText.includes('createFeatureContinuationRecord')) {
    findings.push('desktop continuation flow does not create typed Feature drafts');
  }
  if (!desktopRecordContextText.includes('KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS')) {
    findings.push('desktop continuation flow does not reuse guided Feature presets');
  }
  if (!desktopRecordContextTemplateText.includes('korean-fieldwork-record-context-feature-type')) {
    findings.push('desktop continuation flow does not render Feature type choices');
  }
  if (!desktopRecordContextText.includes('포함 위치: 현재 기록')) {
    findings.push('desktop continuation flow must describe child drafts with 포함 위치 wording');
  }
  if (desktopRecordContextText.includes('상위 기록') || desktopRecordContextText.includes('현재 기록에 묶어 두기')) {
    findings.push('desktop continuation flow still uses hierarchy/묶어 두기 wording');
  }
  if (!desktopRecordContextText.includes('유구로 만들기')) {
    findings.push('desktop continuation unknown Feature option must read 유구로 만들기');
  }
  if (!tabletRecordContextText.includes('포함 위치: {parentPath}')) {
    findings.push('tablet record context must show parent path as 포함 위치');
  }
  if (tabletRecordContextText.includes('parentPath ? ` · ${parentPath}`')) {
    findings.push('tablet record context still folds parent path into the title');
  }
  if (!desktopRecordContextTemplateText.includes('포함 위치: {{parentPathLabel}}')) {
    findings.push('desktop record context must show parent path as 포함 위치');
  }
  if (!desktopPriorityStripText.includes('pendingFeatureDraft')) {
    findings.push('desktop dashboard create flow does not pause Feature drafts for type selection');
  }
  if (!desktopPriorityStripText.includes('createPendingFeatureDraft')) {
    findings.push('desktop dashboard create flow does not create typed Feature drafts');
  }
  if (!desktopPriorityStripTemplateText.includes('korean-fieldwork-feature-draft-picker')) {
    findings.push('desktop dashboard create flow does not render Feature type choices');
  }
  if (!desktopPriorityStripTemplateText.includes('포함 위치')) {
    findings.push('desktop dashboard Feature draft picker must show parent scope as 포함 위치');
  }
  if (desktopPriorityStripTemplateText.includes('묶어 둘')) {
    findings.push('desktop dashboard Feature draft picker still uses ambiguous 묶어 둘 wording');
  }
  if (!desktopPriorityStripText.includes('유구로 만들기')) {
    findings.push('desktop dashboard unknown Feature draft option must read 유구로 만들기');
  }

  return findings;
}

function hasOrderedSubstrings(text, substrings) {
  let previousIndex = -1;

  for (const substring of substrings) {
    const index = text.indexOf(substring);
    if (index === -1 || index <= previousIndex) return false;
    previousIndex = index;
  }

  return true;
}

function validateGuidedFeatureConfig() {
  const findings = [];
  const config = readJsonFile('core/config/Config-KoreanFieldwork.json');
  const valuelists = readJsonFile('core/config/Library/Valuelists/Valuelists.json');
  const koreanLabels = readJsonFile('core/config/Library/Valuelists/Language.projects.ko.json');
  const englishLabels = readJsonFile('core/config/Library/Valuelists/Language.projects.en.json');
  const featureForm = config.forms?.['Feature:default'];
  const requiredFieldValues = collectGuidedFeatureAttributeFieldValues();

  if (!featureForm) {
    return ['Feature:default form is missing from Korean fieldwork configuration'];
  }

  for (const [fieldName, valueIds] of Object.entries(requiredFieldValues)) {
    const field = featureForm.fields?.[fieldName];
    const valuelistId = featureForm.valuelists?.[fieldName];

    if (!field) {
      findings.push(`guided config field missing in Feature:default: ${fieldName}`);
      continue;
    }

    if (field.inputType !== 'checkboxes') {
      findings.push(
        `guided config field must use checkboxes in Feature:default: ${fieldName}`
      );
    }

    if (!valuelistId) {
      findings.push(`guided config field has no valuelist in Feature:default: ${fieldName}`);
      continue;
    }

    const valuelist = valuelists[valuelistId];
    if (!valuelist) {
      findings.push(`guided valuelist missing for ${fieldName}: ${valuelistId}`);
      continue;
    }

    const orderedValueIds = Array.isArray(valuelist.order) ? valuelist.order : [];
    for (const valueId of valueIds) {
      if (!valuelist.values?.[valueId]) {
        findings.push(`guided valuelist value missing for ${fieldName}: ${valueId}`);
      }
      if (!orderedValueIds.includes(valueId)) {
        findings.push(`guided valuelist order missing for ${fieldName}: ${valueId}`);
      }
      if (!koreanLabels[valuelistId]?.values?.[valueId]?.label) {
        findings.push(`guided Korean valuelist label missing for ${fieldName}: ${valueId}`);
      }
      if (!englishLabels[valuelistId]?.values?.[valueId]?.label) {
        findings.push(`guided English valuelist label missing for ${fieldName}: ${valueId}`);
      }
    }
  }

  return findings;
}

function validatePriorityTaskIds() {
  const sources = [
    {
      label: 'tablet',
      filePath: 'mobile/components/Project/korean-fieldwork-today-actions.ts'
    },
    {
      label: 'desktop',
      filePath: 'desktop/src/app/util/korean-fieldwork-today-actions.ts'
    }
  ];
  const findings = [];

  for (const source of sources) {
    const text = readTextFile(source.filePath);

    for (const taskId of sharedPriorityTaskIds) {
      if (!text.includes(`id: '${taskId}'`)) {
        findings.push(`${source.label} priority task id missing: ${taskId}`);
      }
    }
  }

  const desktopTodayActionsText = readTextFile(
    'desktop/src/app/util/korean-fieldwork-today-actions.ts'
  );
  const desktopPriorityStripText = readTextFile(
    'desktop/src/app/components/resources/korean-fieldwork-priority-strip.component.ts'
  );
  const desktopPriorityStripTemplateText = readTextFile(
    'desktop/src/app/components/resources/korean-fieldwork-priority-strip.html'
  );
  const desktopTodayActionsSpecText = readTextFile(
    'desktop/test/unit/util/korean-fieldwork-today-actions.spec.ts'
  );
  const desktopPriorityStripSpecText = readTextFile(
    'desktop/test/unit/components/resources/korean-fieldwork-priority-strip.component.spec.ts'
  );

  for (const token of [
    'secondaryAction?: KoreanFieldworkPriorityTaskAction',
    'secondaryActionDetail?: string',
    "secondaryAction: { type: 'openImport' }",
    'secondaryActionLabel'
  ]) {
    if (!desktopTodayActionsText.includes(token)) {
      findings.push(`desktop priority tasks must expose boundary import secondary action token: ${token}`);
    }
  }
  if (!desktopPriorityStripText.includes('runPriorityTaskSecondaryAction')) {
    findings.push('desktop priority strip must run priority task secondary actions');
  }
  if (!desktopPriorityStripTemplateText.includes('korean-fieldwork-task-secondary-action')) {
    findings.push('desktop priority strip template must render priority task secondary actions');
  }
  const desktopBoundaryImportGuidanceText = readTextFile(
    'desktop/src/app/util/korean-fieldwork-boundary-import-guidance.ts'
  );
  const boundaryImportSyncDetail =
    'SHP/DXF/CSV는 데스크톱 가져오기에서 불러온 뒤 동기화하면 태블릿 지도에서도 조사 경계로 보입니다.';
  if (!desktopBoundaryImportGuidanceText.includes(boundaryImportSyncDetail)) {
    findings.push('desktop boundary import guidance must explain desktop import and tablet sync handoff');
  }
  if (!desktopPriorityStripTemplateText.includes('secondaryActionDetail ||')) {
    findings.push('desktop boundary import actions must expose sync handoff detail in tooltips');
  }
  if (!desktopTodayActionsSpecText.includes('secondaryAction: { type: \'openImport\' }')) {
    findings.push('desktop priority task tests must cover boundary import secondary action');
  }
  if (!desktopTodayActionsSpecText.includes(boundaryImportSyncDetail)
      || !desktopPriorityStripSpecText.includes(boundaryImportSyncDetail)) {
    findings.push('desktop boundary import tests must cover tablet sync handoff detail');
  }
  if (!desktopPriorityStripSpecText.includes('offers import as a secondary boundary setup action from priority tasks')) {
    findings.push('desktop priority strip tests must cover import secondary action execution');
  }
  const tabletMapText = readTextFile('mobile/components/Project/Map/Map.tsx');
  if (!tabletMapText.includes(`${boundaryImportSyncDetail} 태블릿에서는 현장에서 GPS 임시 경계나 위성지도 위치를 바로 보태세요.`)) {
    findings.push('tablet boundary import info must match desktop import and sync handoff');
  }

  return findings;
}

function validateProjectStartSequence() {
  const findings = [];
  const mobileCreateText = readTextFile('mobile/components/Home/CreateProjectModal.tsx');
  const mobileCreateSpecText = readTextFile('mobile/components/Home/CreateProjectModal.spec.tsx');
  const desktopCreateText = readTextFile(
    'desktop/src/app/components/project/create-project-modal.component.ts'
  );
  const desktopCreateTemplateText = readTextFile(
    'desktop/src/app/components/project/create-project-modal.html'
  );
  const desktopCreateSpecText = readTextFile(
    'desktop/test/unit/components/project/create-project-modal.component.spec.ts'
  );
  const startSteps = [
    '프로젝트 기본 조사 방식을 정합니다.',
    '조사 경계 기준을 문장으로 남깁니다.',
    '프로젝트 생성 후 지도에서 경계를 그리거나 가져옵니다.'
  ];
  const boundaryHelp =
    '지도에서 도형을 그리거나 지원되는 파일 가져오기로 확정합니다.';
  const readyStatus =
    '준비 완료. 생성 뒤 지도에서 이 경계를 그리거나 가져와 확정하세요.';
  const desktopReadyStatus =
    '프로젝트 생성 후 지도에서 조사 경계를 그리거나 가져와 확정하세요.';

  for (const step of startSteps) {
    if (!mobileCreateText.includes(step)) {
      findings.push(`tablet create-project start step missing: ${step}`);
    }
    if (!mobileCreateSpecText.includes(step)) {
      findings.push(`tablet create-project test does not cover start step: ${step}`);
    }
    if (!desktopCreateText.includes(step)) {
      findings.push(`desktop create-project start step missing: ${step}`);
    }
    if (!desktopCreateSpecText.includes(step)) {
      findings.push(`desktop create-project test does not cover start step: ${step}`);
    }
  }

  if (!mobileCreateText.includes(boundaryHelp)) {
    findings.push('tablet create-project boundary help must mention draw/import confirmation');
  }
  if (!desktopCreateTemplateText.includes(boundaryHelp)) {
    findings.push('desktop create-project boundary help must mention draw/import confirmation');
  }
  if (!mobileCreateText.includes(readyStatus)) {
    findings.push('tablet create-project ready status must point to draw/import confirmation');
  }
  if (!mobileCreateSpecText.includes(readyStatus)) {
    findings.push('tablet create-project test must cover draw/import ready status');
  }
  if (!desktopCreateText.includes(desktopReadyStatus)) {
    findings.push('desktop create-project ready status must point to draw/import confirmation');
  }
  if (!desktopCreateSpecText.includes(desktopReadyStatus)) {
    findings.push('desktop create-project test must cover draw/import ready status');
  }
  if (desktopCreateText.includes('KOREAN_FIELDWORK_DEFAULT_INVESTIGATION_MODE')) {
    findings.push('desktop create-project must require an explicit investigation-mode selection');
  }
  if (!desktopCreateText.includes("public koreanInvestigationMode: string = '';")) {
    findings.push('desktop create-project investigation mode must start empty');
  }
  if (!desktopCreateSpecText.includes('조사 방식을 선택해야 프로젝트를 만들 수 있습니다.')) {
    findings.push('desktop create-project test must cover missing investigation-mode status');
  }

  return findings;
}

function validateProjectSettingsCompleteness() {
  const findings = [];
  const mobileSettingsText = readTextFile('mobile/app/(tabs)/SettingsScreen.tsx');
  const mobileSettingsSpecText = readTextFile('mobile/test/screens/SettingsScreen.spec.tsx');
  const mobileMapProviderStatusText = readTextFile(
    'mobile/components/Project/Map/korean-fieldwork-map-provider-status.ts'
  );
  const mobileMapProviderStatusSpecText = readTextFile(
    'mobile/components/Project/Map/korean-fieldwork-map-provider-status.spec.ts'
  );
  const mobilePackageText = readTextFile('mobile/package.json');
  const mobileMapText = readTextFile('mobile/components/Project/Map/Map.tsx');
  const mobileKakaoSatellitePickerText = readTextFile(
    'mobile/components/Project/Map/KakaoSatellitePicker.tsx'
  );
  const mobileKakaoSatellitePickerHtmlText = readTextFile(
    'mobile/components/Project/Map/kakao-satellite-picker-html.ts'
  );
  const mobileKakaoSatellitePickerHtmlSpecText = readTextFile(
    'mobile/components/Project/Map/kakao-satellite-picker-html.spec.ts'
  );
  const desktopSettingsText = readTextFile('desktop/src/app/components/settings/settings.component.ts');
  const desktopSettingsTemplateText = readTextFile('desktop/src/app/components/settings/settings.html');
  const desktopSettingsStyleText = readTextFile('desktop/src/app/components/settings/settings.scss');
  const desktopSettingsSpecText = readTextFile(
    'desktop/test/unit/components/settings/settings.component.spec.ts'
  );
  const desktopSettingsModelText = readTextFile('desktop/src/app/services/settings/settings.ts');
  const desktopSettingsProviderText = readTextFile('desktop/src/app/services/settings/settings-provider.ts');
  const desktopSettingsSerializerText = readTextFile('desktop/src/app/services/settings/settings-serializer.ts');
  const desktopMainText = readTextFile('desktop/electron/main.js');
  const desktopMapProviderText = readTextFile(
    'desktop/src/app/util/korean-fieldwork-map-provider-settings.ts'
  );
  const desktopMapProviderSpecText = readTextFile(
    'desktop/test/unit/util/korean-fieldwork-map-provider-settings.spec.ts'
  );
  const desktopProjectSetupText = readTextFile(
    'desktop/src/app/util/korean-fieldwork-project-setup.ts'
  );
  const desktopProjectSetupSpecText = readTextFile(
    'desktop/test/unit/util/korean-fieldwork-project-setup.spec.ts'
  );
  const coreConfigurationNamesText = readTextFile('core/src/configuration/project-configuration-names.ts');
  const coreValuelistsText = readTextFile('core/config/Library/Valuelists/Valuelists.json');
  const coreValuelistKoText = readTextFile('core/config/Library/Valuelists/Language.projects.ko.json');
  const coreConfigurationSpecText = readTextFile('core/test/configuration/korean-fieldwork-configuration.spec.ts');
  const projectSetupTexts = [
    '프로젝트 기본 설정',
    '조사 방식',
    '조사 경계',
    '조사 방식은 오늘 할 일을 묻는 값이 아니라, 이 프로젝트가 어떤 조사인지 정하는 기본값입니다.',
    '프로젝트 초기에 정한 경계 기준입니다. 지도 도형은 조사 경계 기록으로 따로 남깁니다.'
  ];
  const mobilePersonalTexts = ['개인 기본값', '작업자 이름'];

  for (const text of projectSetupTexts) {
    if (!mobileSettingsText.includes(text)) {
      findings.push(`tablet settings missing project setup text: ${text}`);
    }
    if (!desktopSettingsTemplateText.includes(text)) {
      findings.push(`desktop settings missing project setup text: ${text}`);
    }
  }

  for (const text of mobilePersonalTexts) {
    if (!mobileSettingsText.includes(text)) {
      findings.push(`tablet settings missing personal default text: ${text}`);
    }
    if (!mobileSettingsSpecText.includes(text)) {
      findings.push(`tablet settings test must cover personal/project split text: ${text}`);
    }
  }

  for (const text of ['프로젝트 기본 설정', '조사 방식', '조사 경계']) {
    if (!mobileSettingsSpecText.includes(text)) {
      findings.push(`tablet settings test must cover project setup control: ${text}`);
    }
  }

  for (const text of [
    'loads Korean fieldwork setup from the selected project document',
    'saves Korean fieldwork setup changes with general settings',
    'blocks saving Korean fieldwork setup changes until required project basics are filled in',
    'exposes tablet sync values in the Korean fieldwork settings section'
  ]) {
    if (!desktopSettingsSpecText.includes(text)) {
      findings.push(`desktop settings test missing coverage: ${text}`);
    }
  }

  if (!desktopSettingsTemplateText.includes('태블릿 연결')) {
    findings.push('desktop settings must expose tablet sync information for Korean fieldwork projects');
  }
  if (!desktopSettingsTemplateText.includes('조사 방식·경계와 야장 기록은 같은 프로젝트 문서로 동기화됩니다.')) {
    findings.push('desktop settings must explain tablet and desktop project setup sync');
  }
  if (!mobileSettingsText.includes('작업자 이름은 따로 저장할 수 있습니다. 조사 방식과 조사 경계를 채우면 프로젝트 기본값도 함께 저장됩니다.')) {
    findings.push('tablet settings must explain worker name and project setup can be saved separately');
  }

  for (const token of [
    'KoreanFieldworkProjectSetupDefaults',
    'getKoreanFieldworkProjectSetupDefaultsFromDocument',
    'getKoreanFieldworkInvestigationModeOption',
    'createKoreanFieldworkProjectSetupResourceUpdates'
  ]) {
    if (!desktopProjectSetupText.includes(token)) {
      findings.push(`desktop project setup utility missing tablet-sync helper: ${token}`);
    }
  }
  for (const token of [
    'loads tablet-synced setup defaults from the project document',
    'ignores invalid project document mode values while keeping boundary defaults',
    'builds partial tablet-sync project document updates'
  ]) {
    if (!desktopProjectSetupSpecText.includes(token)) {
      findings.push(`desktop project setup utility test missing tablet-sync coverage: ${token}`);
    }
  }
  if (!desktopSettingsText.includes('getKoreanFieldworkProjectSetupDefaultsFromDocument')) {
    findings.push('desktop settings must load project setup through the shared project setup defaults helper');
  }
  if (!desktopSettingsSpecText.includes('falls back to the default mode when a tablet-synced project document has an invalid mode')) {
    findings.push('desktop settings test must cover invalid tablet-synced project setup modes');
  }

  if (!mobileSettingsText.includes('mapProviderSettings')) {
    findings.push('tablet settings missing map provider settings object');
  }
  if (!mobileSettingsSpecText.includes('mapProviderSettings')) {
    findings.push('tablet settings test missing map provider settings object');
  }
  if (!desktopSettingsModelText.includes('mapProviderSettings')) {
    findings.push('desktop settings model missing map provider settings object');
  }

  for (const token of [
    'kakaoLocalRestApiKey',
    'kakaoMapJavaScriptKey',
    'kakaoNativeAppKey'
  ]) {
    if (!mobileSettingsText.includes(token)) {
      findings.push(`tablet settings missing map provider setting: ${token}`);
    }
    if (!mobileSettingsSpecText.includes(token)) {
      findings.push(`tablet settings test missing map provider setting: ${token}`);
    }
    if (!desktopSettingsTemplateText.includes(token)) {
      findings.push(`desktop settings template missing map provider binding: ${token}`);
    }
    if (!desktopMapProviderText.includes(token)) {
      findings.push(`desktop map provider utility missing setting: ${token}`);
    }
  }

  for (const label of [
    '지도 API 키',
    '카카오 Local REST 키',
    '카카오 지도 JavaScript 키',
    '카카오 Native App 키'
  ]) {
    if (!mobileSettingsText.includes(label)) {
      findings.push(`tablet settings missing map provider label: ${label}`);
    }
    if (!desktopSettingsTemplateText.includes(label)) {
      findings.push(`desktop settings missing map provider label: ${label}`);
    }
  }

  for (const token of [
    'setMapProviderSettings',
    'saves Kakao map provider keys without hardcoding them into project setup'
  ]) {
    if (!mobileSettingsSpecText.includes(token)) {
      findings.push(`tablet settings test missing Kakao key coverage: ${token}`);
    }
  }

  for (const token of [
    'getKoreanMapProviderNotice',
    'hasKoreanSatelliteMapDisplayKey'
  ]) {
    if (!desktopSettingsText.includes(token)) {
      findings.push(`desktop settings component missing map provider method: ${token}`);
    }
    if (!desktopSettingsTemplateText.includes(token)) {
      findings.push(`desktop settings template missing map provider method: ${token}`);
    }
  }

  if (!desktopSettingsStyleText.includes('korean-fieldwork-map-provider-settings')) {
    findings.push('desktop settings style must cover the map provider settings block');
  }
  if (!desktopSettingsSpecText.includes('tracks Kakao map provider keys in the Korean fieldwork settings section')) {
    findings.push('desktop settings test missing Kakao map provider key coverage');
  }
  if (!desktopSettingsSerializerText.includes("configToWrite['mapProviderSettings']")) {
    findings.push('desktop settings serializer must persist map provider settings');
  }
  if (!desktopSettingsProviderText.includes('normalizeKoreanFieldworkMapProviderSettings')) {
    findings.push('desktop settings provider must normalize map provider settings for existing configs');
  }
  if (!desktopMainText.includes('setMapProviderSettingsDefaults')) {
    findings.push('desktop Electron config defaults must include map provider settings');
  }

  for (const text of [
    'REST 키',
    'JavaScript 키',
    'Native App 키'
  ]) {
    if (!mobileMapProviderStatusText.includes(text)) {
      findings.push(`tablet map provider status missing key role wording: ${text}`);
    }
    if (!mobileMapProviderStatusSpecText.includes(text)) {
      findings.push(`tablet map provider status test missing key role wording: ${text}`);
    }
    if (!desktopMapProviderText.includes(text)) {
      findings.push(`desktop map provider utility missing key role wording: ${text}`);
    }
    if (!desktopMapProviderSpecText.includes(text)) {
      findings.push(`desktop map provider utility test missing key role wording: ${text}`);
    }
  }
  if (mobileMapProviderStatusText.includes('다음 구현 단계')) {
    findings.push('tablet map provider status must not expose implementation-stage wording');
  }
  if (mobileMapProviderStatusText.includes('Android Kakao Maps SDK 브리지')) {
    findings.push('tablet map provider status must not promise an SDK bridge as the active field path');
  }
  if (!mobileMapProviderStatusText.includes('JavaScript 키 WebView 경로를 우선 사용')
      || !mobileMapProviderStatusSpecText.includes('JavaScript 키 WebView 경로를 우선 사용')
      || !desktopMapProviderText.includes('JavaScript 키 WebView 경로를 우선 사용')
      || !desktopMapProviderSpecText.includes('JavaScript 키 WebView 경로를 우선 사용')) {
    findings.push('map provider notices must explain that JavaScript WebView is the active tablet satellite path');
  }
  if (!mobileMapProviderStatusText.includes('데스크톱에서 가져온 뒤 동기화')
      || !mobileMapProviderStatusSpecText.includes('데스크톱에서 가져온 뒤 동기화')
      || !desktopMapProviderText.includes('SHP/DXF/CSV 경계를 가져와 같은 프로젝트로 동기화')
      || !desktopMapProviderSpecText.includes('SHP/DXF/CSV 경계를 가져와 같은 프로젝트로 동기화')) {
    findings.push('map provider notices must point SHP/DXF/CSV boundary work to desktop import and sync');
  }
  if (!desktopMapProviderText.includes('return !!normalized.kakaoMapJavaScriptKey.trim();')
      || desktopMapProviderText.includes('|| !!normalized.kakaoNativeAppKey.trim()')
      || !desktopMapProviderSpecText.includes('kakaoNativeAppKey: \'native-key\'')
      || !desktopMapProviderSpecText.includes('})).toBe(false);')) {
    findings.push('desktop satellite map readiness must be true only for the active JavaScript WebView key');
  }

  if (!mobilePackageText.includes('react-native-webview')) {
    findings.push('tablet package missing react-native-webview for Kakao satellite picker');
  }
  for (const token of [
    'KakaoSatellitePicker',
    'createSurveyBoundaryFromKakaoSatellite',
    'kakaoMapJavaScriptKey',
    'REFERENCE_BASEMAP_PROVIDER_KAKAO_HYBRID'
  ]) {
    if (!mobileMapText.includes(token)) {
      findings.push(`tablet map screen missing Kakao satellite boundary flow: ${token}`);
    }
  }
  for (const [label, text] of [
    ['core configuration constants', coreConfigurationNamesText],
    ['core valuelists', coreValuelistsText],
    ['core Korean valuelist labels', coreValuelistKoText],
    ['core configuration test', coreConfigurationSpecText],
    ['tablet map drafts', readTextFile('mobile/components/Project/Map/korean-fieldwork-drafts.ts')],
    ['tablet map drafts test', readTextFile('mobile/components/Project/Map/korean-fieldwork-drafts.spec.ts')]
  ]) {
    if (!text.includes('kakaoHybrid')) {
      findings.push(`${label} must preserve Kakao satellite boundary metadata as kakaoHybrid`);
    }
  }
  for (const token of [
    'WebView',
    'buildKakaoSatellitePickerHtml',
    'onPickLocation'
  ]) {
    if (!mobileKakaoSatellitePickerText.includes(token)) {
      findings.push(`tablet Kakao satellite picker missing WebView flow: ${token}`);
    }
  }
  for (const token of [
    'dapi.kakao.com/v2/maps/sdk.js',
    'kakao.maps.MapTypeId.HYBRID',
    'window.ReactNativeWebView.postMessage'
  ]) {
    if (!mobileKakaoSatellitePickerHtmlText.includes(token)) {
      findings.push(`tablet Kakao satellite picker HTML missing SDK behavior: ${token}`);
    }
    if (!mobileKakaoSatellitePickerHtmlSpecText.includes(token)) {
      findings.push(`tablet Kakao satellite picker HTML test missing SDK behavior: ${token}`);
    }
  }

  return findings;
}

function validateProjectInvestigationModeWording() {
  const findings = [];
  const expectedProjectModePrompt =
    '시굴·발굴·지표·입회 중 이 프로젝트의 조사 방식을 정하세요.';
  const deprecatedModePrompt =
    '시굴·발굴·지표·입회 중 오늘의 조사 방식을 정하세요.';
  const desktopWorkflowText = readTextFile('desktop/src/app/util/korean-fieldwork-workflow.ts');
  const desktopWorkflowSpecText = readTextFile(
    'desktop/test/unit/util/korean-fieldwork-workflow.spec.ts'
  );
  const desktopPriorityStripSpecText = readTextFile(
    'desktop/test/unit/components/resources/korean-fieldwork-priority-strip.component.spec.ts'
  );
  const desktopPriorityStripText = readTextFile(
    'desktop/src/app/components/resources/korean-fieldwork-priority-strip.component.ts'
  );
  const desktopPriorityStripTemplateText = readTextFile(
    'desktop/src/app/components/resources/korean-fieldwork-priority-strip.html'
  );
  const tabletMapText = readTextFile('mobile/components/Project/Map/Map.tsx');
  const tabletMapStartPanelText = readTextFile(
    'mobile/components/Project/Map/korean-fieldwork-map-start-panel.ts'
  );
  const tabletMapStartPanelSpecText = readTextFile(
    'mobile/components/Project/Map/korean-fieldwork-map-start-panel.spec.ts'
  );
  const tabletInvestigationModePanelText = readTextFile(
    'mobile/components/Project/KoreanFieldworkInvestigationModePanel.tsx'
  );
  const tabletInvestigationModePanelSpecText = readTextFile(
    'mobile/components/Project/KoreanFieldworkInvestigationModePanel.spec.tsx'
  );
  const desktopDraftDefaultsText = readTextFile(
    'desktop/src/app/util/korean-fieldwork-draft-defaults.ts'
  );
  const desktopDocumentDraftText = readTextFile(
    'desktop/src/app/util/korean-fieldwork-document-drafts.ts'
  );
  const desktopTodayActionsText = readTextFile('desktop/src/app/util/korean-fieldwork-today-actions.ts');
  const desktopOperationWrapText = readTextFile('desktop/src/app/util/korean-fieldwork-operation-wrap.ts');
  const desktopHierarchyText = readTextFile('desktop/src/app/util/korean-fieldwork-hierarchy.ts');
  const desktopUnitMatrixText = readTextFile('desktop/src/app/util/korean-fieldwork-unit-matrix.ts');
  const desktopUnitMatrixSpecText = readTextFile('desktop/test/unit/util/korean-fieldwork-unit-matrix.spec.ts');
  const tabletUnitMatrixText = readTextFile('mobile/components/Project/korean-fieldwork-unit-matrix.ts');
  const tabletUnitMatrixComponentText = readTextFile('mobile/components/Project/KoreanFieldworkUnitMatrix.tsx');
  const tabletUnitMatrixSpecText = readTextFile('mobile/components/Project/korean-fieldwork-unit-matrix.spec.ts');
  const tabletUnitMatrixComponentSpecText = readTextFile('mobile/components/Project/KoreanFieldworkUnitMatrix.spec.tsx');
  const desktopRecordActionsText = readTextFile('desktop/src/app/util/korean-fieldwork-record-actions.ts');
  const desktopWorkbenchText = readTextFile('desktop/src/app/util/korean-fieldwork-workbench.ts');
  const desktopProgressBoardText = readTextFile('desktop/src/app/util/korean-fieldwork-progress-board.ts');
  const desktopCloseoutText = readTextFile('desktop/src/app/util/korean-fieldwork-closeout.ts');
  const desktopRecordContextPanelText = readTextFile(
    'desktop/src/app/components/docedit/core/korean-fieldwork-record-context-panel.component.ts'
  );
  const desktopNarrativeAssistText = readTextFile(
    'desktop/src/app/util/korean-fieldwork-narrative-assist.ts'
  );
  const desktopFeatureGuidanceText = readTextFile(
    'desktop/src/app/util/korean-fieldwork-feature-guidance.ts'
  );
  const desktopOrientationPanelTemplateText = readTextFile(
    'desktop/src/app/components/docedit/core/korean-fieldwork-orientation-panel.html'
  );
  const tabletQuickRecordPanelText = readTextFile(
    'mobile/components/Project/KoreanFieldworkQuickRecordPanel.tsx'
  );
  const tabletFeatureAttributesText = readTextFile(
    'mobile/components/Project/korean-fieldwork-feature-attributes.ts'
  );
  const tabletFieldNotesText = readTextFile(
    'mobile/components/Project/korean-fieldwork-field-notes.ts'
  );
  const desktopNotebookDigestText = readTextFile(
    'desktop/src/app/util/korean-fieldwork-notebook-digest.ts'
  );
  const koreanValuelistKoText = readTextFile(
    'core/config/Library/Valuelists/Language.projects.ko.json'
  );
  const koreanValuelistEnText = readTextFile(
    'core/config/Library/Valuelists/Language.projects.en.json'
  );
  const koreanFieldworkKoText = readTextFile(
    'core/config/Language-KoreanFieldwork.ko.json'
  );
  const mobileFieldFlowWordingSources = [
    {
      label: 'tablet project screen',
      text: readTextFile('mobile/app/(tabs)/ProjectScreen/index.tsx')
    },
    {
      label: 'tablet today actions',
      text: readTextFile('mobile/components/Project/korean-fieldwork-today-actions.ts')
    },
    {
      label: 'tablet workbench',
      text: readTextFile('mobile/components/Project/korean-fieldwork-workbench.ts')
    },
    {
      label: 'tablet progress',
      text: readTextFile('mobile/components/Project/korean-fieldwork-progress.ts')
    },
    {
      label: 'tablet closeout',
      text: readTextFile('mobile/components/Project/korean-fieldwork-closeout.ts')
    },
    {
      label: 'tablet draft continuation',
      text: readTextFile('mobile/components/Project/korean-fieldwork-draft-continuation.ts')
    },
    {
      label: 'tablet narrative assist',
      text: readTextFile('mobile/components/Project/korean-fieldwork-narrative-assist.ts')
    },
    {
      label: 'tablet draft context panel',
      text: readTextFile('mobile/components/Project/KoreanFieldworkDraftContextPanel.tsx')
    },
    {
      label: 'tablet scope panel',
      text: readTextFile('mobile/components/Project/KoreanFieldworkScopePanel.tsx')
    },
    {
      label: 'tablet field-flow tests',
      text: [
        'mobile/components/Project/korean-fieldwork-field-notes.spec.ts',
        'mobile/components/Project/korean-fieldwork-record-actions.spec.ts',
        'mobile/components/Project/korean-fieldwork-unit-matrix.spec.ts',
        'mobile/components/Project/KoreanFieldworkDraftContextPanel.spec.tsx'
      ].map(readTextFile).join('\n')
    }
  ];
  const featureFieldNoteAnchors = [
    'feature-field-note-flow',
    'feature-sketch-measure-evidence',
    '[스케치·약측]',
    '[사진·도면 번호]',
    '유구 성격을 확정하지 말고',
    '약도/평면/단면 스케치 번호',
    '유구명은 관찰·그림·사진 근거가 모이면 보완'
  ];
  const tabletNarrativeAssistText = mobileFieldFlowWordingSources.find(
    entry => entry.label === 'tablet narrative assist'
  )?.text ?? '';
  for (const requiredAnchor of featureFieldNoteAnchors) {
    if (!tabletNarrativeAssistText.includes(requiredAnchor)) {
      findings.push(`tablet narrative assist must bind feature descriptions to sketches/measurements: ${requiredAnchor}`);
    }
    if (!desktopNarrativeAssistText.includes(requiredAnchor)) {
      findings.push(`desktop narrative assist must bind feature descriptions to sketches/measurements: ${requiredAnchor}`);
    }
  }
  for (const requiredAnchor of ['스케치/약측 기준', '사진/도면 번호']) {
    if (!desktopFeatureGuidanceText.includes(requiredAnchor)) {
      findings.push(`desktop feature guidance templates must bind descriptions to sketch/measurement evidence: ${requiredAnchor}`);
    }
  }
  for (const requiredAnchor of [
    '유구 성격 미정이면 미정으로 두고',
    '평면·단면 스케치 번호',
    '약측값',
    '사진·도면 번호',
    '성격 미정/추정 사유'
  ]) {
    if (!tabletFeatureAttributesText.includes(requiredAnchor)) {
      findings.push(`tablet feature observation placeholders must bind descriptions to sketch/measurement evidence: ${requiredAnchor}`);
    }
  }
  for (const [label, text] of [
    ['tablet field notes', tabletFieldNotesText],
    ['desktop notebook digest', desktopNotebookDigestText]
  ]) {
    if (!text.includes('사진·도면·스케치·유물·시료 번호')) {
      findings.push(`${label} must include sketch numbers in field-note evidence numbering`);
    }
    if (!text.includes('사진·도면·유물·시료 번호')) {
      findings.push(`${label} must keep the previous evidence-number label as a parsing alias`);
    }
  }
  if (!koreanValuelistKoText.includes('"label": "조사 중 기록"')) {
    findings.push('Korean excavation context wording must fold quadrant/half-style investigation into 조사 중 기록');
  }
  if (!koreanValuelistEnText.includes('"label": "In-progress investigation record"')) {
    findings.push('English excavation context wording must fold quadrant investigation into an in-progress record');
  }
  for (const deprecatedText of ['조사 중 구획 기록', 'Quadrant investigation']) {
    if (koreanValuelistKoText.includes(deprecatedText) || koreanValuelistEnText.includes(deprecatedText)) {
      findings.push(`Korean fieldwork valuelists still expose deprecated investigation-method wording: ${deprecatedText}`);
    }
  }
  for (const [label, text] of [
    ['tablet quick record panel', tabletQuickRecordPanelText],
    ['desktop orientation panel', desktopOrientationPanelTemplateText]
  ]) {
    if (text.includes('방위 기준')) {
      findings.push(`${label} should not show a separate orientation-reference selector; use magnetic north by default`);
    }
  }
  if (koreanFieldworkKoText.includes('"label": "방위 기준"')
      || !koreanFieldworkKoText.includes('"label": "자북 메모"')) {
    findings.push('Korean fieldwork orientation reference label must read as a magnetic-north note, not a selectable bearing standard');
  }
  const projectModeDefinition =
    '조사 방식은 오늘 할 일을 묻는 값이 아니라, 이 프로젝트가 어떤 조사인지 정하는 기본값입니다.';

  if (!desktopWorkflowText.includes(expectedProjectModePrompt)) {
    findings.push('desktop workflow must describe investigation mode as a project-level setup choice');
  }
  if (desktopWorkflowText.includes(deprecatedModePrompt)) {
    findings.push('desktop workflow still describes investigation mode as today-specific');
  }
  if (!desktopWorkflowSpecText.includes(expectedProjectModePrompt)) {
    findings.push('desktop workflow test must cover project-level investigation-mode wording');
  }
  if (!desktopWorkflowText.includes('작업 순서')) {
    findings.push('desktop workflow must use 작업 순서 wording for sequence guidance');
  }
  if (desktopWorkflowText.includes('조사 흐름')) {
    findings.push('desktop workflow still uses broad 조사 흐름 wording');
  }
  if (!desktopWorkflowSpecText.includes('시굴·표본 작업 순서')) {
    findings.push('desktop workflow test must cover project-mode 작업 순서 wording');
  }
  const desktopFieldFlowWordingSources = [
    { label: 'desktop workflow', text: desktopWorkflowText },
    { label: 'desktop workflow test', text: desktopWorkflowSpecText },
    { label: 'desktop priority strip', text: desktopPriorityStripText },
    { label: 'desktop priority strip template', text: desktopPriorityStripTemplateText },
    { label: 'desktop priority strip test', text: desktopPriorityStripSpecText },
    { label: 'desktop today actions', text: desktopTodayActionsText },
    { label: 'desktop hierarchy', text: desktopHierarchyText },
    { label: 'desktop unit matrix', text: desktopUnitMatrixText },
    { label: 'desktop record actions', text: desktopRecordActionsText },
    { label: 'desktop workbench', text: desktopWorkbenchText },
    { label: 'desktop progress board', text: desktopProgressBoardText },
    { label: 'desktop closeout', text: desktopCloseoutText },
    { label: 'desktop record context panel', text: desktopRecordContextPanelText },
    { label: 'desktop narrative assist', text: desktopNarrativeAssistText }
  ];
  for (const { label, text } of desktopFieldFlowWordingSources) {
    for (const forbiddenTerm of ['조사 기준', '기록 기준', '작업 단위', '조사 단위']) {
      if (text.includes(forbiddenTerm)) {
        findings.push(`${label} still uses confusing desktop field-flow wording: ${forbiddenTerm}`);
      }
    }
  }
  for (const { label, text } of mobileFieldFlowWordingSources) {
    for (const forbiddenTerm of ['조사 기준', '기록 기준', '작업 단위', '조사 단위', '현장단위']) {
      if (text.includes(forbiddenTerm)) {
        findings.push(`${label} still uses confusing tablet field-flow wording: ${forbiddenTerm}`);
      }
    }
  }
  if (!desktopWorkflowText.includes('조사 구역 기록')) {
    findings.push('desktop workflow must call the Operation step 조사 구역 기록');
  }
  if (!desktopTodayActionsText.includes('조사 구역 정리')) {
    findings.push('desktop today actions must use 조사 구역 정리 for legacy root records');
  }
  if (!desktopTodayActionsText.includes('getLegacyRootDocumentsForOperation')
      || !desktopOperationWrapText.includes('createOperationRelationUpdate')
      || !desktopOperationWrapText.includes('getOperationWrapConfirmationMessage')) {
    findings.push('desktop today actions must share tablet operation-wrap logic for legacy root records');
  }
  if (!desktopPriorityStripTemplateText.includes('기록 진행표')) {
    findings.push('desktop priority strip template must label the unit matrix as 기록 진행표');
  }
  for (const [label, text] of [
    ['tablet unit matrix util', tabletUnitMatrixText],
    ['desktop unit matrix util', desktopUnitMatrixText]
  ]) {
    for (const token of ['FeatureOverview', 'statusLabel', 'nextActionLabel']) {
      if (!text.includes(token)) {
        findings.push(`${label} must expose all-feature overview rows with status and next-action labels: ${token}`);
      }
    }
  }
  if (!tabletUnitMatrixComponentText.includes('전체 유구 현황')
      || !desktopPriorityStripTemplateText.includes('전체 유구 현황')) {
    findings.push('tablet and desktop record panels must expose an 전체 유구 현황 table');
  }
  for (const [label, text] of [
    ['tablet unit matrix spec', tabletUnitMatrixSpecText],
    ['tablet unit matrix component spec', tabletUnitMatrixComponentSpecText],
    ['desktop unit matrix spec', desktopUnitMatrixSpecText],
    ['desktop priority strip spec', desktopPriorityStripSpecText]
  ]) {
    if (!text.includes('전체 유구 현황') && !text.includes('FeatureOverview')) {
      findings.push(`${label} must cover the all-feature overview table`);
    }
  }
  if (
    desktopWorkflowText.indexOf("id: 'mode'") === -1
    || desktopWorkflowText.indexOf("id: 'boundary'") === -1
    || desktopWorkflowText.indexOf("id: 'operation'") === -1
    || desktopWorkflowText.indexOf("id: 'mode'") > desktopWorkflowText.indexOf("id: 'boundary'")
    || desktopWorkflowText.indexOf("id: 'boundary'") > desktopWorkflowText.indexOf("id: 'operation'")
  ) {
    findings.push('desktop workflow must put investigation mode before survey boundary before fieldwork unit');
  }
  if (!hasOrderedSubstrings(tabletInvestigationModePanelText, [
    "id: 'mode'",
    "id: 'boundary'",
    "id: 'operation'"
  ])) {
    findings.push('tablet project setup panel must put investigation mode before survey boundary before fieldwork unit');
  }
  if (
    !tabletInvestigationModePanelSpecText.includes('expectSetupStepOrder')
    || !hasOrderedSubstrings(tabletInvestigationModePanelSpecText, [
      'setupStep_mode',
      'setupStep_boundary',
      'setupStep_operation'
    ])
  ) {
    findings.push('tablet investigation mode panel test must cover mode-boundary-operation setup order');
  }
  if (!desktopWorkflowSpecText.includes("['mode', 'current']")) {
    findings.push('desktop workflow test must make investigation mode the first setup step');
  }
  if (
    desktopWorkflowSpecText.indexOf("['boundary', 'todo']") === -1
    || desktopWorkflowSpecText.indexOf("['operation', 'todo']") === -1
    || desktopWorkflowSpecText.indexOf("['boundary', 'todo']")
      > desktopWorkflowSpecText.indexOf("['operation', 'todo']")
  ) {
    findings.push('desktop workflow test must cover survey boundary before fieldwork unit');
  }
  if (desktopWorkflowText.includes('!!boundarySummary || getCategoryCount')) {
    findings.push('desktop workflow must not mark survey boundary done from the project boundary summary alone');
  }
  if (!desktopWorkflowText.includes('기준만 있음. 지도에서 GPS 임시 경계를 만들거나 SHP/DXF/CSV·위성지도 기준으로 확정하세요.')) {
    findings.push('desktop workflow must keep boundary-summary-only projects on GPS/file/satellite confirmation');
  }
  if (!desktopWorkflowText.includes('지도에서 조사 경계를 만들거나 SHP/DXF/CSV·위성지도 기준으로 확정하세요.')) {
    findings.push('desktop workflow must route boundary setup through GPS/file/satellite wording');
  }
  if (!desktopWorkflowSpecText.includes("['boundary', 'attention']")) {
    findings.push('desktop workflow test must cover boundary-summary-only attention state');
  }
  if (!desktopPriorityStripSpecText.includes("['mode', 'current']")) {
    findings.push('desktop priority strip test must keep investigation mode before boundary');
  }
  if (!desktopPriorityStripSpecText.includes("['조사 선택', 'done']")) {
    findings.push('desktop priority strip test must show 조사 선택 before 조사 구역 in complete workflows');
  }
  if (!desktopPriorityStripSpecText.includes("['조사 구역 기록', 'done']")) {
    findings.push('desktop priority strip test must show 조사 구역 기록 in complete workflows');
  }
  if (
    desktopPriorityStripSpecText.indexOf("['조사 선택', 'done']") === -1
    || desktopPriorityStripSpecText.indexOf("['조사 구역', 'done']") === -1
    || desktopPriorityStripSpecText.indexOf("['조사 구역 기록', 'done']") === -1
    || desktopPriorityStripSpecText.indexOf("['조사 선택', 'done']")
      > desktopPriorityStripSpecText.indexOf("['조사 구역', 'done']")
    || desktopPriorityStripSpecText.indexOf("['조사 구역', 'done']")
      > desktopPriorityStripSpecText.indexOf("['조사 구역 기록', 'done']")
  ) {
    findings.push('desktop priority strip complete workflow order must put 조사 선택 before 조사 구역 before 조사 구역 기록');
  }
  if (!desktopPriorityStripText.includes('getTodayQuickActions')) {
    findings.push('desktop priority strip must expose today quick actions matching the tablet map board');
  }
  if (!desktopPriorityStripText.includes('runTodayQuickAction')) {
    findings.push('desktop priority strip must run today quick actions from the header');
  }
  if (!desktopPriorityStripText.includes("'create-survey-boundary',")) {
    findings.push('desktop today quick record action must prioritize survey boundary creation before field records');
  }
  if (desktopPriorityStripText.includes("task.id !== 'create-survey-boundary'")) {
    findings.push('desktop today quick record action still skips the survey boundary task');
  }
  if (!desktopPriorityStripSpecText.includes('경계 만들기')) {
    findings.push('desktop priority strip test must cover survey boundary as the first quick record action');
  }
  if (!tabletMapText.includes('getKoreanFieldworkMapStartPanelCopy')) {
    findings.push('tablet map start panel must use shared boundary-first start copy');
  }
  if (tabletMapStartPanelText.includes('현장 단위부터 시작')) {
    findings.push('tablet map start panel still tells users to start from fieldwork units');
  }
  if (!tabletMapStartPanelText.includes('조사 경계 생성')
      || !tabletMapStartPanelText.includes('GPS 임시 경계')
      || !tabletMapStartPanelText.includes('SHP/DXF/CSV')
      || !tabletMapStartPanelText.includes('위성지도')) {
    findings.push('tablet map start panel must expose GPS, file import, and satellite boundary setup choices');
  }
  if (
    tabletMapText.indexOf("title={location ? startPanelCopy.primaryActionTitle : 'GPS 확인 중'}") === -1
    || tabletMapText.indexOf('title="트렌치 추가"') === -1
    || tabletMapText.indexOf("title={location ? startPanelCopy.primaryActionTitle : 'GPS 확인 중'}")
      > tabletMapText.indexOf('title="트렌치 추가"')
  ) {
    findings.push('tablet map start panel must put GPS boundary creation before trench creation');
  }
  if (!tabletMapStartPanelSpecText.includes('survey boundary confirmation wording')) {
    findings.push('tablet map start panel test must cover boundary-first startup wording');
  }
  if (!desktopPriorityStripTemplateText.includes('korean-fieldwork-today-quick-actions')) {
    findings.push('desktop priority strip template must render today quick actions');
  }
  for (const quickActionLabel of ['오늘 일지', '마감 점검']) {
    if (!desktopPriorityStripText.includes(quickActionLabel)) {
      findings.push(`desktop today quick action missing label: ${quickActionLabel}`);
    }
    if (!desktopPriorityStripSpecText.includes(quickActionLabel)) {
      findings.push(`desktop priority strip test must cover today quick action: ${quickActionLabel}`);
    }
  }
  if (!desktopPriorityStripSpecText.includes('유구 만들기')) {
    findings.push('desktop priority strip test must cover the next-record quick action');
  }
  if (
    !desktopDocumentDraftText.includes('boundarySummary?: string')
    || !desktopDocumentDraftText.includes('options.boundarySummary')
  ) {
    findings.push('desktop document drafts must accept and pass project boundary summaries');
  }
  for (const option of [
    'boundaryAccuracy?: string',
    'boundarySource?: string',
    'referenceBasemapProvider?: string'
  ]) {
    if (!desktopDocumentDraftText.includes(option)) {
      findings.push(`desktop document drafts must accept imported SurveyBoundary option: ${option}`);
    }
  }
  for (const option of [
    'boundaryAccuracy: options.boundaryAccuracy',
    'boundarySource: options.boundarySource',
    'referenceBasemapProvider: options.referenceBasemapProvider'
  ]) {
    if (!desktopDocumentDraftText.includes(option)) {
      findings.push(`desktop document drafts must pass imported SurveyBoundary option: ${option}`);
    }
  }
  if (!desktopDraftDefaultsText.includes('surveyBoundaryNote: boundarySummary')) {
    findings.push('desktop SurveyBoundary defaults must copy project boundary summaries into surveyBoundaryNote');
  }
  for (const option of [
    'boundaryAccuracy?: string',
    'boundarySource?: string',
    'referenceBasemapProvider?: string',
    'options.boundaryAccuracy',
    'options.boundarySource',
    'options.referenceBasemapProvider'
  ]) {
    if (!desktopDraftDefaultsText.includes(option)) {
      findings.push(`desktop SurveyBoundary defaults must support imported boundary metadata: ${option}`);
    }
  }
  const desktopDraftDefaultsSpecText = readTextFile(
    'desktop/test/unit/util/korean-fieldwork-draft-defaults.spec.ts'
  );
  const desktopDocumentDraftSpecText = readTextFile(
    'desktop/test/unit/util/korean-fieldwork-document-drafts.spec.ts'
  );
  for (const token of ['shpImport', 'importedReference', 'importedVectorLayer']) {
    if (!desktopDraftDefaultsSpecText.includes(token)) {
      findings.push(`desktop SurveyBoundary defaults test missing imported boundary token: ${token}`);
    }
    if (!desktopDocumentDraftSpecText.includes(token)) {
      findings.push(`desktop document draft test missing imported boundary token: ${token}`);
    }
  }
  if (
    !desktopPriorityStripText.includes('KOREAN_FIELDWORK_PROJECT_BOUNDARY_SUMMARY_FIELD')
    || !desktopPriorityStripText.includes('getProjectBoundarySummaryDraftValue')
  ) {
    findings.push('desktop quick SurveyBoundary drafts must read the project boundary summary');
  }
  if (!desktopPriorityStripSpecText.includes('surveyBoundaryNote: \'1구역 북쪽 능선부터 남쪽 농로까지\'')) {
    findings.push('desktop priority strip test must prove SurveyBoundary drafts copy the boundary summary');
  }

  for (const source of [
    {
      label: 'tablet settings',
      text: readTextFile('mobile/app/(tabs)/SettingsScreen.tsx')
    },
    {
      label: 'desktop settings',
      text: readTextFile('desktop/src/app/components/settings/settings.html')
    }
  ]) {
    if (!source.text.includes(projectModeDefinition)) {
      findings.push(`${source.label} must explain investigation mode as a project default`);
    }
  }

  return findings;
}

function validateRawFormFieldRules() {
  const findings = [];
  const tabletSource = 'mobile/components/common/forms/DocumentForm.tsx';
  const desktopSource = 'desktop/src/app/components/docedit/core/edit-form.component.ts';
  const tabletAuxiliaryGroups = extractStringCollection(
    tabletSource,
    'AUXILIARY_RAW_GROUP_NAMES'
  );
  const desktopSystemGroups = extractStringCollection(
    desktopSource,
    'SYSTEM_RAW_GROUP_NAMES'
  );
  const tabletPanelFields = extractStringCollection(
    tabletSource,
    'KOREAN_FIELDWORK_PANEL_FIELD_NAMES'
  );
  const tabletTriggerFields = extractStringCollection(
    tabletSource,
    'KOREAN_FIELDWORK_MODE_TRIGGER_FIELD_NAMES'
  );
  const tabletText = readTextFile(tabletSource);
  const desktopText = readTextFile(desktopSource);
  const desktopTemplateText = readTextFile('desktop/src/app/components/docedit/core/edit-form.html');
  const tabletGroupLabelText = readTextFile('mobile/components/common/I18NLabel.tsx');
  const coreKoreanLibraryLabelsText = readTextFile('core/config/Library/Language.ko.json');
  const tabletDraftContextText = readTextFile('mobile/components/Project/KoreanFieldworkDraftContextPanel.tsx');
  const tabletAddModalText = readTextFile('mobile/components/Project/DocumentAddModal.tsx');
  const tabletProjectScreenText = readTextFile('mobile/app/(tabs)/ProjectScreen/index.tsx');
  const rawStorageSummary = '새 유구 기록은 위의 시대/시기·유구 성격·유구별 핵심 속성·야장 메모만 입력하면 충분합니다. 이 영역은 이전 양식에서 가져온 값이 있을 때만 확인합니다.';
  const auxiliaryRawStorageLabel = '가져온 기존 항목';
  const forbiddenAuxiliaryRawStorageTerms = [
    '기존 값 확인',
    '유구 기록은 위의 시대/시기·유구 성격·유구별 핵심 속성·추가 관찰만으로 충분합니다.',
    '새 유구 기록은 위의 시대/시기·유구 성격·유구별 핵심 속성·추가 관찰만 입력하면 충분합니다.',
    '필요 시 추가 필드',
    '확인 중인 추가 항목',
    '가져온 값·특수 필드 확인',
    '특수 필드를 검토',
    '보조 원자료',
    '호환용 보조 필드',
    '확인 중인 보조 항목'
  ];
  const rawFormTextChecks = [
    { label: 'tablet raw form', text: tabletText },
    {
      label: 'tablet add form test',
      text: readTextFile('mobile/components/Project/DocumentAdd.spec.tsx')
    },
    {
      label: 'tablet edit form test',
      text: readTextFile('mobile/components/Project/DocumentEdit.spec.tsx')
    },
    { label: 'desktop raw form', text: desktopTemplateText }
  ];
  const guidedFieldNames = Object.keys(collectGuidedFeatureAttributeFieldValues());
  const tabletUsesDerivedFeatureAttributeFields = (
    tabletText.match(/\.\.\.KOREAN_FIELDWORK_FEATURE_ATTRIBUTE_FIELD_NAMES/g) ?? []
  ).length >= 2;

  findings.push(
    ...compareStringSets(
      tabletAuxiliaryGroups,
      desktopSystemGroups,
      'tablet auxiliary raw group missing for desktop system group',
      'desktop system raw group missing for tablet auxiliary group'
    )
  );

  for (const fieldName of guidedFieldNames) {
    if (!tabletUsesDerivedFeatureAttributeFields && !tabletPanelFields.includes(fieldName)) {
      findings.push(`tablet raw form panel-field list missing guided attribute field: ${fieldName}`);
    }
    if (!tabletUsesDerivedFeatureAttributeFields && !tabletTriggerFields.includes(fieldName)) {
      findings.push(`tablet raw form trigger list missing guided attribute field: ${fieldName}`);
    }
  }

  if (!tabletUsesDerivedFeatureAttributeFields) {
    findings.push('tablet raw form must derive guided feature fields from feature attributes');
  }

  if (!desktopText.includes('...KOREAN_FIELDWORK_FEATURE_GUIDANCE_FIELD_NAMES')) {
    findings.push('desktop raw form must derive guided feature fields from presets');
  }

  if (!tabletText.includes(rawStorageSummary)) {
    findings.push('tablet raw form missing Korean fieldwork raw-storage summary');
  }
  if (!desktopTemplateText.includes(rawStorageSummary)) {
    findings.push('desktop raw form missing Korean fieldwork raw-storage summary');
  }
  if (!tabletText.includes(auxiliaryRawStorageLabel)) {
    findings.push('tablet raw form missing auxiliary raw-storage label');
  }
  if (!desktopTemplateText.includes(auxiliaryRawStorageLabel)) {
    findings.push('desktop raw form missing auxiliary raw-storage label');
  }
  for (const { label, text } of rawFormTextChecks) {
    for (const forbiddenTerm of forbiddenAuxiliaryRawStorageTerms) {
      if (text.includes(forbiddenTerm)) {
        findings.push(`${label} still uses legacy auxiliary raw-storage wording: ${forbiddenTerm}`);
      }
    }
  }
  if (!tabletText.includes('getVisibleRawGroups(category, resource)')) {
    findings.push('tablet raw form must decide auxiliary visibility from current resource values');
  }
  if (!tabletText.includes('KOREAN_FIELDWORK_MANAGED_CATEGORY_NAMES')) {
    findings.push('tablet raw form must keep guided mode for managed Korean fieldwork categories');
  }
  if (!desktopText.includes('KOREAN_FIELDWORK_MANAGED_CATEGORY_NAMES')) {
    findings.push('desktop raw form must keep guided mode for managed Korean fieldwork categories');
  }
  if (!tabletText.includes('groupHasRawStorageValue(group, resource)')) {
    findings.push('tablet raw form must hide blank auxiliary fields in Korean fieldwork mode');
  }
  if (!tabletText.includes('rawFieldHasValue(field, resource)')) {
    findings.push('tablet raw form must show only imported auxiliary fields that already have values');
  }
  if (!desktopText.includes('rawStorageFieldHasValue(field)')) {
    findings.push('desktop raw form must show only imported auxiliary fields that already have values');
  }
  if (!readTextFile('mobile/components/common/forms/DocumentForm.spec.tsx').includes('shows only imported fields')
      || !readTextFile('desktop/test/unit/components/docedit/core/edit-form.component.spec.ts').includes('emptyLegacyNote')) {
    findings.push('raw form tests must prove empty auxiliary fields stay hidden after expanding imported values');
  }
  for (const { label, text } of [
    { label: 'tablet common group labels', text: tabletGroupLabelText },
    { label: 'desktop Korean library labels', text: coreKoreanLibraryLabelsText }
  ]) {
    for (const expectedLabel of ['포함 위치', '식별 정보', '자료 관리', '작업 기록']) {
      if (!text.includes(expectedLabel)) {
        findings.push(`${label} must use field-facing raw group label: ${expectedLabel}`);
      }
    }
  }
  if (!tabletDraftContextText.includes('포함 위치') || !tabletAddModalText.includes('포함 위치')) {
    findings.push('tablet feature creation context must describe parent scope as 포함 위치');
  }
  if (tabletDraftContextText.includes('상위 기록') || tabletAddModalText.includes('상위 기록')
      || tabletDraftContextText.includes('묶음 위치') || tabletAddModalText.includes('묶음 위치')) {
    findings.push('tablet feature creation context still uses hierarchy/ambiguous scope wording');
  }
  if (!tabletProjectScreenText.includes('현장 보조판 보기')) {
    findings.push('tablet project screen must label secondary panels as 현장 보조판 보기');
  }
  if (tabletProjectScreenText.includes('자료 관리 보기') || tabletProjectScreenText.includes('자료 관리 접기')) {
    findings.push('tablet project screen still labels secondary panels as 자료 관리');
  }

  return findings;
}

function validateRecordPanelOrder() {
  const findings = [];
  const desktopPriorityStripText = readTextFile(
    'desktop/src/app/components/resources/korean-fieldwork-priority-strip.component.ts'
  );
  const desktopPriorityStripSpecText = readTextFile(
    'desktop/test/unit/components/resources/korean-fieldwork-priority-strip.component.spec.ts'
  );
  const desktopDocumentDraftText = readTextFile(
    'desktop/src/app/util/korean-fieldwork-document-drafts.ts'
  );
  const desktopHierarchyText = readTextFile(
    'desktop/src/app/util/korean-fieldwork-hierarchy.ts'
  );
  const desktopPriorityStripTemplateText = readTextFile(
    'desktop/src/app/components/resources/korean-fieldwork-priority-strip.html'
  );
  const desktopNotebookDigestText = readTextFile(
    'desktop/src/app/util/korean-fieldwork-notebook-digest.ts'
  );
  const desktopNotebookDigestSpecText = readTextFile(
    'desktop/test/unit/util/korean-fieldwork-notebook-digest.spec.ts'
  );
  const desktopEvidenceReviewText = readTextFile(
    'desktop/src/app/util/korean-fieldwork-evidence-review.ts'
  );
  const desktopEvidenceReviewSpecText = readTextFile(
    'desktop/test/unit/util/korean-fieldwork-evidence-review.spec.ts'
  );
  const desktopReadinessPanelText = readTextFile(
    'desktop/src/app/components/docedit/core/korean-fieldwork-readiness-panel.component.ts'
  );
  const desktopReadinessPanelSpecText = readTextFile(
    'desktop/test/unit/components/docedit/core/korean-fieldwork-readiness-panel.component.spec.ts'
  );
  const desktopRecordContextPanelText = readTextFile(
    'desktop/src/app/components/docedit/core/korean-fieldwork-record-context-panel.component.ts'
  );
  const desktopRecordContextPanelTemplateText = readTextFile(
    'desktop/src/app/components/docedit/core/korean-fieldwork-record-context-panel.html'
  );
  const desktopRecordContextPanelSpecText = readTextFile(
    'desktop/test/unit/components/docedit/core/korean-fieldwork-record-context-panel.component.spec.ts'
  );
  const desktopWorkbenchText = readTextFile(
    'desktop/src/app/util/korean-fieldwork-workbench.ts'
  );
  const desktopWorkbenchSpecText = readTextFile(
    'desktop/test/unit/util/korean-fieldwork-workbench.spec.ts'
  );
  const tabletFieldNotesText = readTextFile(
    'mobile/components/Project/korean-fieldwork-field-notes.ts'
  );
  const tabletFieldNotesSpecText = readTextFile(
    'mobile/components/Project/korean-fieldwork-field-notes.spec.ts'
  );
  const tabletHierarchyBoardText = readTextFile(
    'mobile/components/Project/KoreanFieldworkHierarchyBoard.tsx'
  );

  assertSourceOrder(
    findings,
    'tablet add record form',
    readTextFile('mobile/app/(tabs)/ProjectScreen/DocumentAdd.tsx'),
    [
      '<KoreanFieldworkDraftContextPanel',
      '<KoreanFieldworkDraftPresetPanel',
      '<KoreanFieldworkQuickRecordPanel',
      '<KoreanFieldworkNarrativeAssistPanel',
      '<KoreanFieldworkSoilColorPanel',
      '<KoreanFieldworkDraftContinuationPanel'
    ]
  );

  assertSourceOrder(
    findings,
    'tablet edit record form',
    readTextFile('mobile/app/(tabs)/ProjectScreen/DocumentEdit.tsx'),
    [
      '<KoreanFieldworkRecordContextPanel',
      '<KoreanFieldworkRecordActionPanel',
      '<KoreanFieldworkQuickRecordPanel',
      '<KoreanFieldworkNarrativeAssistPanel',
      '<KoreanFieldworkSoilColorPanel'
    ]
  );

  assertSourceOrder(
    findings,
    'desktop edit record form',
    readTextFile('desktop/src/app/components/docedit/core/edit-form.html'),
    [
      '<korean-fieldwork-record-context-panel',
      '<korean-fieldwork-readiness-panel',
      '<korean-fieldwork-draft-preset-panel',
      '<korean-fieldwork-feature-guidance-panel',
      '<korean-fieldwork-quick-record-panel',
      '<korean-fieldwork-narrative-assist-panel',
      '<korean-fieldwork-orientation-panel',
      '<korean-fieldwork-soil-color-panel'
    ]
  );

  if (
    !desktopPriorityStripText.includes('recordMemoTemplate: true')
    || !desktopDocumentDraftText.includes('recordMemoTemplate?: boolean')
  ) {
    findings.push('desktop selected-record PenMemo drafts must enable the field-note template');
  }
  if (
    !desktopPriorityStripText.includes('continueNotebookEntry')
    || !desktopPriorityStripText.includes('getKoreanFieldworkNotebookContinuationSeed')
    || !desktopDocumentDraftText.includes('recordMemoContinuation?:')
    || !desktopNotebookDigestText.includes('getKoreanFieldworkNotebookContinuationSeed')
  ) {
    findings.push('desktop notebook follow-ups must be continuable as seeded PenMemo drafts');
  }
  if (
    !desktopDocumentDraftText.includes('관찰 내용')
    || !desktopDocumentDraftText.includes('스케치·약측/근거 번호')
    || !desktopDocumentDraftText.includes('다음 작업')
    || !desktopDocumentDraftText.includes('makeRecordMemoTemplate')
  ) {
    findings.push('desktop selected-record PenMemo draft template must bind observation to sketch/measurement evidence');
  }
  if (!desktopPriorityStripSpecText.includes('description: \'[관찰 내용]\\n\\n[스케치·약측/근거 번호]\\n\\n[다음 작업]\'')) {
    findings.push('desktop priority strip test must prove selected-record PenMemo drafts include the note template');
  }
  if (!desktopWorkbenchText.includes('getPenMemoSketchSummaryLabel')
      || !desktopWorkbenchText.includes('reasons.push(getPenMemoSketchSummaryLabel')) {
    findings.push('desktop workbench must carry tablet sketch memo size into the selected-record work list');
  }
  if (!desktopWorkbenchSpecText.includes('스케치 메모 1획/1점')) {
    findings.push('desktop workbench test must prove tablet sketch memo size appears before opening the record');
  }
  if (!desktopPriorityStripText.includes('getNotebookRecentEntries')) {
    findings.push('desktop notebook panel must expose recent notebook entries like the tablet ledger');
  }
  if (!readTextFile('desktop/src/app/components/resources/korean-fieldwork-priority-strip.html')
      .includes('korean-fieldwork-notebook-strip-kind">최근')) {
    findings.push('desktop notebook panel template must render recent notebook rows');
  }
  if (!readTextFile('desktop/src/app/components/resources/korean-fieldwork-priority-strip.html')
      .includes('korean-fieldwork-notebook-strip-continue')) {
    findings.push('desktop notebook panel template must render continuation buttons');
  }
  if (!desktopPriorityStripSpecText.includes('hasNotebookRecentEntries')) {
    findings.push('desktop priority strip test must cover recent notebook rows');
  }
  if (!desktopPriorityStripSpecText.includes('continues notebook entries as seeded PenMemo drafts')) {
    findings.push('desktop priority strip test must cover notebook continuation drafts');
  }
  if (!desktopNotebookDigestSpecText.includes('builds continuation seeds for notebook follow-ups')) {
    findings.push('desktop notebook digest test must cover continuation seed creation');
  }
  if (!tabletHierarchyBoardText.includes('이어진 기록')
      || !tabletHierarchyBoardText.includes('포함 위치')) {
    findings.push('tablet hierarchy board must describe connected records with field-facing wording');
  }
  if (!desktopHierarchyText.includes('makeKoreanFieldworkHierarchyLanes')
      || !desktopPriorityStripText.includes('makeKoreanFieldworkHierarchyLanes')
      || !desktopPriorityStripTemplateText.includes('이어진 기록')
      || !desktopPriorityStripTemplateText.includes('포함 위치')) {
    findings.push('desktop records panel must mirror tablet connected-record hierarchy lanes with field-facing wording');
  }
  if (!desktopPriorityStripSpecText.includes('connected record hierarchy lanes')
      || !desktopPriorityStripSpecText.includes('getHierarchyScopeLabel')) {
    findings.push('desktop priority strip test must cover connected record hierarchy lanes');
  }
  if (!desktopEvidenceReviewText.includes('pendingPenMemoTranscriptions')
      || !desktopEvidenceReviewText.includes('getPendingPenMemoTranscriptionDocuments')
      || !desktopEvidenceReviewText.includes('getPendingPenMemoTranscriptionIssues')
      || !desktopEvidenceReviewText.includes('getPenMemoSketchSummaries')
      || !desktopEvidenceReviewText.includes('getPenMemoSketchSummaryLabel')
      || !desktopEvidenceReviewText.includes('getPenMemoSketchPreview')
      || !desktopEvidenceReviewText.includes('getPenMemoTranscriptionSummaryLabel')
      || !desktopEvidenceReviewText.includes('penMemoSketchSummaries')
      || !desktopEvidenceReviewText.includes('penMemoTranscriptionSummaries')
      || !desktopEvidenceReviewText.includes('pen-memo-handwriting-transcription')
      || !desktopEvidenceReviewText.includes('penMemoTranscription')) {
    findings.push('desktop evidence review must carry tablet PenMemo transcription backlog into readiness summaries');
  }
  if (!desktopEvidenceReviewSpecText.includes('tablet handwriting PenMemo')
      || !desktopEvidenceReviewSpecText.includes('tablet sketch memo')
      || !desktopEvidenceReviewSpecText.includes('penMemoSketchSummaries')
      || !desktopEvidenceReviewSpecText.includes('스케치 메모 1획/1점')
      || !desktopEvidenceReviewSpecText.includes('태블릿 손글씨 원자료')
      || !desktopEvidenceReviewSpecText.includes('desktop SVG previews')
      || !desktopEvidenceReviewSpecText.includes('pen-memo-handwriting-transcription')
      || !desktopEvidenceReviewSpecText.includes('pen-memo-auto-transcript-review')
      || !desktopEvidenceReviewSpecText.includes('penMemoTranscription')) {
    findings.push('desktop evidence review test must cover tablet handwriting PenMemo transcription backlog');
  }
  if (!desktopReadinessPanelText.includes('pendingPenMemoTranscriptions')
      || !desktopReadinessPanelText.includes('getPenMemoTranscriptionSummaryLabels')
      || !desktopReadinessPanelText.includes('penMemoSketchSummaries')
      || !desktopReadinessPanelText.includes('스케치 메모')
      || !desktopReadinessPanelText.includes('야장 전사')
      || !desktopReadinessPanelText.includes('전사 대기')
      || !desktopReadinessPanelText.includes('soilColorCandidateSummaries')
      || !desktopReadinessPanelText.includes('토색 후보')) {
    findings.push('desktop readiness panel must show PenMemo transcription backlog as field-facing evidence review');
  }
  if (!desktopReadinessPanelSpecText.includes('pendingPenMemoTranscriptions')
      || !desktopReadinessPanelSpecText.includes('penMemoSketches')
      || !desktopReadinessPanelSpecText.includes('스케치 메모')
      || !desktopReadinessPanelSpecText.includes('태블릿 손글씨 원자료')
      || !desktopReadinessPanelSpecText.includes('canOpenIssueDocument')
      || !desktopReadinessPanelSpecText.includes('야장 전사')
      || !desktopReadinessPanelSpecText.includes('soilColorCandidates')
      || !desktopReadinessPanelSpecText.includes('먼셀 후보 10YR 4/3')) {
    findings.push('desktop readiness panel test must cover PenMemo transcription backlog labels');
  }
  if (!desktopEvidenceReviewText.includes('soilColorCandidateSummaries')
      || !desktopEvidenceReviewText.includes('getSoilColorCandidateSummaries')
      || !desktopEvidenceReviewSpecText.includes('photo-derived soil color candidates')) {
    findings.push('desktop evidence review must carry tablet photo-derived soil color candidates into review panels');
  }
  if (!desktopRecordContextPanelText.includes('getSoilColorCandidateSummaries')
      || !desktopRecordContextPanelText.includes('getPenMemoSketchSummaryLabel')
      || !desktopRecordContextPanelText.includes('getPenMemoSketchPreview')
      || !desktopRecordContextPanelText.includes('evidenceInsights')
      || !desktopRecordContextPanelTemplateText.includes('getEvidenceInsights()')
      || !desktopRecordContextPanelTemplateText.includes('korean-fieldwork-record-context-sketch-preview')
      || !desktopRecordContextPanelSpecText.includes('먼셀 후보 10YR 4/3')
      || !desktopRecordContextPanelSpecText.includes('태블릿 야장 전사')
      || !desktopRecordContextPanelSpecText.includes('sketchPreview')) {
    findings.push('desktop record context panel must render tablet soil-color candidates and sketch memo details inside the opened record');
  }
  if (!desktopRecordContextPanelText.includes('pushFeatureAttributeChip')
      || !desktopRecordContextPanelText.includes('formatFeatureAttributeLabels')
      || !desktopRecordContextPanelSpecText.includes('가마 핵심 연소부·소성부')
      || !desktopRecordContextPanelSpecText.includes('가마 핵심 속성 미기록')) {
    findings.push('desktop record context panel must render guided feature core attributes inside the opened record');
  }
  for (const { label, text } of [
    { label: 'desktop notebook digest', text: desktopNotebookDigestText },
    { label: 'tablet field notes', text: tabletFieldNotesText }
  ]) {
    if (!text.includes('FIELD_NOTE_SECTION_ALIASES')
        || !text.includes('근거 번호')
        || !text.includes('스케치·약측/근거 번호')) {
      findings.push(`${label} must accept old and sketch/measurement evidence-number section labels`);
    }
    if (!text.includes('hasMeaningfulFieldNoteText')) {
      findings.push(`${label} must ignore field-note section templates without content`);
    }
  }
  for (const { label, text } of [
    { label: 'desktop notebook digest test', text: desktopNotebookDigestSpecText },
    { label: 'tablet field notes test', text: tabletFieldNotesSpecText }
  ]) {
    if (!text.includes('[관찰 내용]\\n\\n[근거 번호]\\n\\n[다음 작업]')) {
      findings.push(`${label} must cover empty field-note templates`);
    }
    if (!text.includes('[근거 번호] 사진 12')) {
      findings.push(`${label} must cover short evidence-number labels`);
    }
  }

  return findings;
}

function assertSourceOrder(findings, label, text, markers) {
  let previousIndex = -1;
  let previousMarker = '';

  for (const marker of markers) {
    const index = text.indexOf(marker);

    if (index === -1) {
      findings.push(`${label} missing panel marker: ${marker}`);
      continue;
    }

    if (previousIndex !== -1 && index < previousIndex) {
      findings.push(`${label} must place ${marker} after ${previousMarker}`);
    }

    previousIndex = index;
    previousMarker = marker;
  }
}

function validateConnectedRecordWording() {
  const findings = [];
  const sources = [
    {
      label: 'tablet progress board',
      filePath: 'mobile/components/Project/KoreanFieldworkProgressBoard.tsx'
    },
    {
      label: 'tablet record action panel',
      filePath: 'mobile/components/Project/KoreanFieldworkRecordActionPanel.tsx'
    },
    {
      label: 'tablet project record list',
      filePath: 'mobile/app/(tabs)/ProjectScreen/index.tsx'
    },
    {
      label: 'tablet connected-record board',
      filePath: 'mobile/components/Project/KoreanFieldworkHierarchyBoard.tsx'
    },
    {
      label: 'desktop progress board template',
      filePath: 'desktop/src/app/components/resources/korean-fieldwork-priority-strip.html'
    },
    {
      label: 'desktop record context panel',
      filePath: 'desktop/src/app/components/docedit/core/korean-fieldwork-record-context-panel.component.ts'
    }
  ];
  const deprecatedTerms = ['묶인 기록', '관련 기록'];

  for (const source of sources) {
    const text = readTextFile(source.filePath);

    if (!text.includes('이어진 기록')) {
      findings.push(`${source.label} must describe child/context records as 이어진 기록`);
    }
    for (const term of deprecatedTerms) {
      if (text.includes(term)) {
        findings.push(`${source.label} still uses relationship-heavy wording: ${term}`);
      }
    }
  }

  for (const source of [
    {
      label: 'tablet progress board test',
      filePath: 'mobile/components/Project/KoreanFieldworkProgressBoard.spec.tsx'
    },
    {
      label: 'tablet record action panel test',
      filePath: 'mobile/components/Project/KoreanFieldworkRecordActionPanel.spec.tsx'
    },
    {
      label: 'tablet connected-record board test',
      filePath: 'mobile/components/Project/KoreanFieldworkHierarchyBoard.spec.tsx'
    },
    {
      label: 'desktop record context panel test',
      filePath: 'desktop/test/unit/components/docedit/core/korean-fieldwork-record-context-panel.component.spec.ts'
    }
  ]) {
    if (!readTextFile(source.filePath).includes('이어진 기록')) {
      findings.push(`${source.label} must cover 이어진 기록 wording`);
    }
  }

  return findings;
}

function validateScopeMetricWording() {
  const findings = [];
  const desktopBoundarySummaryText = readTextFile('desktop/src/app/util/korean-fieldwork-boundary-summary.ts');
  const desktopBoundarySummarySpecText = readTextFile(
    'desktop/test/unit/util/korean-fieldwork-boundary-summary.spec.ts'
  );
  const desktopScopeSummaryText = readTextFile('desktop/src/app/util/korean-fieldwork-scope-summary.ts');
  const desktopScopeSummarySpecText = readTextFile(
    'desktop/test/unit/util/korean-fieldwork-scope-summary.spec.ts'
  );
  const desktopOperationWrapSpecText = readTextFile(
    'desktop/test/unit/util/korean-fieldwork-operation-wrap.spec.ts'
  );
  const desktopWorkflowText = readTextFile('desktop/src/app/util/korean-fieldwork-workflow.ts');
  const desktopWorkflowSpecText = readTextFile('desktop/test/unit/util/korean-fieldwork-workflow.spec.ts');
  const sources = [
    {
      label: 'tablet scope panel',
      filePath: 'mobile/components/Project/KoreanFieldworkScopePanel.tsx'
    },
    {
      label: 'tablet scope panel test',
      filePath: 'mobile/components/Project/KoreanFieldworkScopePanel.spec.tsx'
    },
    {
      label: 'desktop priority strip',
      filePath: 'desktop/src/app/components/resources/korean-fieldwork-priority-strip.component.ts'
    },
    {
      label: 'desktop priority strip test',
      filePath: 'desktop/test/unit/components/resources/korean-fieldwork-priority-strip.component.spec.ts'
    }
  ];

  for (const source of sources) {
    const text = readTextFile(source.filePath);

    if (!text.includes('현장 기록')) {
      findings.push(`${source.label} must label scope structure counts as 현장 기록`);
    }
    if (text.includes("label: '구조'") || text.includes('구조 ${this.scopeSummary.structureCount}')) {
      findings.push(`${source.label} still exposes scope metric as 구조`);
    }
  }

  if (!desktopScopeSummaryText.includes('조사 구역 확정 필요')) {
    findings.push('desktop scope summary must distinguish boundary summary from confirmed map/import boundary');
  }
  if (!desktopScopeSummaryText.includes('조사 경계 필요')) {
    findings.push('desktop scope summary must ask for survey boundary setup with field wording');
  }
  if (!desktopScopeSummaryText.includes('기준만 있음. GPS 임시 경계, SHP/DXF/CSV, 위성지도 중 하나로 확정하세요.')) {
    findings.push('desktop scope summary must route boundary-summary-only projects back to GPS/file/satellite confirmation');
  }
  if (!desktopScopeSummaryText.includes('GPS 임시 경계, SHP/DXF/CSV, 위성지도 기준으로 확정한 경계가 없습니다.')) {
    findings.push('desktop scope summary must name GPS, file, and satellite boundary sources when no boundary exists');
  }
  if (!desktopScopeSummaryText.includes('legacyRootRecordCount')
      || !desktopScopeSummaryText.includes('getLegacyRootDocumentsForOperation')
      || !desktopScopeSummaryText.includes('부모 없이 떠 있는 기존 기록')) {
    findings.push('desktop scope summary must count parentless legacy records before operation creation');
  }
  if (!desktopScopeSummarySpecText.includes('조사 경계 필요')) {
    findings.push('desktop scope summary test must cover boundary setup before records');
  }
  if (!desktopScopeSummarySpecText.includes('조사 구역 확정 필요')) {
    findings.push('desktop scope summary test must cover boundary-summary-only confirmation state');
  }
  if (!desktopScopeSummarySpecText.includes('legacyRootRecordCount')
      || !desktopOperationWrapSpecText.includes('getLegacyRootDocumentsForOperation')
      || !desktopOperationWrapSpecText.includes('createOperationRelationUpdate')) {
    findings.push('desktop scope tests must cover legacy record wrapping under a new operation');
  }
  if (!desktopBoundarySummaryText.includes('카카오 위성지도 기준')
      || !desktopBoundarySummaryText.includes('SHP 가져오기')
      || !desktopBoundarySummaryText.includes('GPS 임시')) {
    findings.push('desktop boundary summary must expose GPS, import, and Kakao satellite boundary sources');
  }
  if (!desktopBoundarySummarySpecText.includes('카카오 위성지도 기준')
      || !desktopBoundarySummarySpecText.includes('SHP 가져오기 · 가져온 참고자료')
      || !desktopBoundarySummarySpecText.includes('GPS 임시 · GPS 대략')) {
    findings.push('desktop boundary summary test must cover GPS, import, and Kakao satellite labels');
  }
  if (!desktopScopeSummaryText.includes('getKoreanFieldworkBoundarySummaryLabel')
      || !desktopWorkflowText.includes('getKoreanFieldworkBoundarySummaryLabel')) {
    findings.push('desktop scope and workflow summaries must use the shared boundary source label helper');
  }
  if (!desktopScopeSummarySpecText.includes('SHP 가져오기 · 가져온 참고자료')
      || !desktopWorkflowSpecText.includes('카카오 위성지도 기준')) {
    findings.push('desktop scope/workflow tests must prove confirmed boundary source labels are visible');
  }

  return findings;
}

function validateSoilColorReviewWorkflow() {
  const findings = [];
  const reviewStatuses = ['manualRecorded', 'candidatesAvailable', 'reviewed', 'notRun'];
  const panelSources = [
    {
      label: 'tablet soil color panel',
      filePath: 'mobile/components/Project/KoreanFieldworkSoilColorPanel.tsx'
    },
    {
      label: 'desktop soil color panel',
      filePath: 'desktop/src/app/components/docedit/core/korean-fieldwork-soil-color-panel.component.ts'
    }
  ];
  const panelTemplates = [
    {
      label: 'tablet soil color panel template',
      filePath: 'mobile/components/Project/KoreanFieldworkSoilColorPanel.tsx'
    },
    {
      label: 'desktop soil color panel template',
      filePath: 'desktop/src/app/components/docedit/core/korean-fieldwork-soil-color-panel.html'
    }
  ];
  const panelTests = [
    {
      label: 'tablet soil color panel test',
      filePath: 'mobile/components/Project/KoreanFieldworkSoilColorPanel.spec.tsx'
    },
    {
      label: 'desktop soil color panel test',
      filePath: 'desktop/test/unit/components/docedit/core/korean-fieldwork-soil-color-panel.component.spec.ts'
    }
  ];
  const assistGenerators = [
    {
      label: 'tablet soil color assist utility',
      filePath: 'mobile/components/Project/soil-color-photo-assist.ts'
    },
    {
      label: 'desktop soil color assist utility',
      filePath: 'desktop/src/app/util/korean-fieldwork-soil-color-photo-assist.ts'
    }
  ];
  const tabletCameraText = readTextFile('mobile/components/Project/SoilProfileCameraButton.tsx');
  const tabletCameraTestText = readTextFile('mobile/components/Project/SoilProfileCameraButton.spec.ts');
  const desktopCloseoutText = readTextFile('desktop/src/app/util/korean-fieldwork-closeout.ts');
  const desktopCloseoutSpecText = readTextFile('desktop/test/unit/util/korean-fieldwork-closeout.spec.ts');
  const desktopWorkbenchText = readTextFile('desktop/src/app/util/korean-fieldwork-workbench.ts');
  const desktopWorkbenchSpecText = readTextFile('desktop/test/unit/util/korean-fieldwork-workbench.spec.ts');
  const desktopCandidateText = readTextFile('desktop/src/app/util/korean-fieldwork-soil-color-candidates.ts');
  const desktopCandidateSpecText = readTextFile('desktop/test/unit/util/korean-fieldwork-soil-color-candidates.spec.ts');

  for (const source of panelSources) {
    const text = readTextFile(source.filePath);

    for (const status of reviewStatuses) {
      if (!text.includes(status)) {
        findings.push(`${source.label} missing soil color review status: ${status}`);
      }
    }
    if (!text.includes('soilColorAssistCandidates')) {
      findings.push(`${source.label} must keep photo-derived Munsell candidates editable`);
    }
    if (!text.includes('soilProfileColorSwatches')) {
      findings.push(`${source.label} must store reviewed numbered Munsell swatches`);
    }
  }

  for (const source of panelTemplates) {
    const text = readTextFile(source.filePath);

    if (!text.includes('먼셀값')) {
      findings.push(`${source.label} must use Korean Munsell label 먼셀값`);
    }
    if (text.includes('Munsell 값')) {
      findings.push(`${source.label} still uses mixed-language Munsell label`);
    }
    if (!text.includes('토색 메모')) {
      findings.push(`${source.label} must expose soil color memo wording`);
    }
    if (!text.includes('사진 판독 후보')) {
      findings.push(`${source.label} must label photo-derived candidates as 사진 판독 후보`);
    }
    if (!text.includes('사진에서 읽은 먼셀 후보')) {
      findings.push(`${source.label} must explain photo-derived candidates as Munsell candidates`);
    }
    if (!text.includes('보정판')) {
      findings.push(`${source.label} must use 보정판 wording for soil color calibration targets`);
    }
    if (text.includes('보정표')) {
      findings.push(`${source.label} still uses 보정표 instead of 보정판`);
    }
  }

  for (const source of panelTests) {
    const text = readTextFile(source.filePath);

    for (const status of reviewStatuses) {
      if (!text.includes(status)) {
        findings.push(`${source.label} must cover soil color review status: ${status}`);
      }
    }
    if (!text.includes('soilColorAssistCandidates')) {
      findings.push(`${source.label} must cover editable photo-derived Munsell candidates`);
    }
    if (!text.includes('soilProfileColorSwatches')) {
      findings.push(`${source.label} must cover reviewed numbered Munsell swatches`);
    }
  }

  if (!readTextFile(
    'desktop/test/unit/components/docedit/core/korean-fieldwork-soil-color-panel.component.spec.ts'
  ).includes('field-facing soil color labels')) {
    findings.push('desktop soil color panel test must cover field-facing labels');
  }
  const desktopSoilColorPanelText = readTextFile(
    'desktop/src/app/components/docedit/core/korean-fieldwork-soil-color-panel.component.ts'
  );
  const desktopSoilColorPanelSpecText = readTextFile(
    'desktop/test/unit/components/docedit/core/korean-fieldwork-soil-color-panel.component.spec.ts'
  );
  if (!desktopSoilColorPanelText.includes('extractMunsellCandidateOptions')
      || desktopSoilColorPanelText.includes('RegExpMatchArray')) {
    findings.push('desktop soil color panel must use shared Munsell candidate parser instead of inline regex');
  }
  if (!desktopSoilColorPanelSpecText.includes('shared Munsell candidate parser')) {
    findings.push('desktop soil color panel test must cover the shared Munsell candidate parser');
  }

  for (const source of assistGenerators) {
    const text = readTextFile(source.filePath);

    if (!text.includes('candidatesAvailable')) {
      findings.push(`${source.label} must leave photo-derived Munsell values as candidates`);
    }
    if (text.includes('reviewed') || text.includes('manualRecorded')) {
      findings.push(`${source.label} must not auto-confirm photo-derived Munsell candidates`);
    }
    if (!text.includes('먼셀값')) {
      findings.push(`${source.label} must use Korean field wording 먼셀값 in user-facing fallback text`);
    }
    if (text.includes('Munsell 값')) {
      findings.push(`${source.label} still uses mixed-language Munsell 값 wording`);
    }
  }

  if (!desktopCloseoutText.includes('사진에서 읽은 먼셀 후보')) {
    findings.push('desktop closeout must explain photo-derived soil color values as 먼셀 후보');
  }
  if (!desktopCloseoutText.includes('먼셀값')) {
    findings.push('desktop closeout must use Korean field wording 먼셀값');
  }
  if (!desktopCloseoutText.includes('getMunsellCandidateSummaryLabel')
      || !desktopCloseoutSpecText.includes('먼셀 후보 10YR 4/3')) {
    findings.push('desktop closeout must carry exact photo-derived Munsell candidate values into review issues');
  }
  if (!desktopWorkbenchText.includes('getMunsellCandidateSummaryLabel')
      || !desktopWorkbenchSpecText.includes('먼셀 후보 10YR 4/3')) {
    findings.push('desktop workbench must show exact photo-derived Munsell candidate values before opening the record');
  }
  if (!desktopCandidateText.includes('extractMunsellCandidateOptions')
      || !desktopCandidateText.includes('GLEY')
      || !desktopCandidateText.includes('먼셀 후보')
      || !desktopCandidateSpecText.includes('GLEY 1 5/N')) {
    findings.push('desktop Munsell candidate parser must mirror tablet candidate extraction for review surfaces');
  }
  if (desktopCloseoutText.includes('Munsell 값') || desktopCloseoutText.includes('Munsell 후보')) {
    findings.push('desktop closeout still uses mixed-language Munsell wording');
  }

  if (!tabletCameraText.includes('createSoilColorAssistUpdatesFromPhotoBase64')) {
    findings.push('tablet soil profile camera must request photo-derived Munsell candidate updates');
  }
  if (!tabletCameraTestText.includes('candidatesAvailable')) {
    findings.push('tablet soil profile camera test must keep photo-derived Munsell values as candidates');
  }
  if (tabletCameraText.includes('reviewed') || tabletCameraText.includes('manualRecorded')) {
    findings.push('tablet soil profile camera must not auto-confirm photo-derived Munsell candidates');
  }

  return findings;
}

function validateProgressModeAwareness() {
  const findings = [];
  const tabletSource = 'mobile/components/Project/korean-fieldwork-progress.ts';
  const desktopSource = 'desktop/src/app/util/korean-fieldwork-progress-board.ts';
  const tabletText = readTextFile(tabletSource);
  const desktopText = readTextFile(desktopSource);
  const excavationDetail = '제토 뒤 확인한 유구를 조사 경계 안에 먼저 기록하세요.';
  const excavationAction = '유구 기록';

  if (!tabletText.includes('investigationModeId')) {
    findings.push('tablet progress board does not accept the investigation mode');
  }
  if (!tabletText.includes("investigationModeId === 'excavation'")) {
    findings.push('tablet progress board does not branch excavation progress toward features');
  }
  if (!desktopText.includes('investigationMode')) {
    findings.push('desktop progress board does not accept the investigation mode');
  }
  if (!desktopText.includes("investigationMode === 'excavation'")) {
    findings.push('desktop progress board does not branch excavation progress toward features');
  }

  for (const source of [
    { label: 'tablet', text: tabletText },
    { label: 'desktop', text: desktopText }
  ]) {
    if (!source.text.includes(excavationDetail)) {
      findings.push(`${source.label} progress board missing excavation feature-first detail`);
    }
    if (!source.text.includes(excavationAction)) {
      findings.push(`${source.label} progress board missing excavation feature action`);
    }
  }

  return findings;
}

function validateRecordActionEvidencePriority() {
  const findings = [];
  const desktopSource = 'desktop/src/app/util/korean-fieldwork-record-actions.ts';
  const mobileSource = 'mobile/components/Project/korean-fieldwork-record-actions.ts';
  const desktopScopeSource = 'desktop/src/app/util/korean-fieldwork-scope-summary.ts';
  const desktopRecordContextSource = 'desktop/src/app/components/docedit/core/korean-fieldwork-record-context-panel.component.ts';
  const desktopRecordContextTemplate = 'desktop/src/app/components/docedit/core/korean-fieldwork-record-context-panel.html';
  const desktopRecordContextSpec = 'desktop/test/unit/components/docedit/core/korean-fieldwork-record-context-panel.component.spec.ts';
  const desktopRecordEvidenceSource = 'desktop/src/app/util/korean-fieldwork-record-evidence.ts';
  const desktopRecordEvidenceSpec = 'desktop/test/unit/util/korean-fieldwork-record-evidence.spec.ts';
  const desktopDocumentDraftSource = 'desktop/src/app/util/korean-fieldwork-document-drafts.ts';
  const desktopDocumentDraftSpec = 'desktop/test/unit/util/korean-fieldwork-document-drafts.spec.ts';
  const mobileDraftContinuationSource = 'mobile/components/Project/korean-fieldwork-draft-continuation.ts';
  const mobileDraftContinuationSpec = 'mobile/components/Project/korean-fieldwork-draft-continuation.spec.ts';
  const desktopCategories = extractStringCollectionInOrder(
    desktopSource,
    'PREFERRED_EVIDENCE_CATEGORIES'
  );
  const mobileChipIds = extractStringCollectionInOrder(
    mobileSource,
    'PREFERRED_EVIDENCE_ACTION_IDS'
  );
  const desktopScopeEvidenceCategories = extractStringCollectionInOrder(
    desktopScopeSource,
    'EVIDENCE_CATEGORIES'
  );
  const desktopChipIds = desktopCategories.map(mapEvidenceCategoryToChipId);
  const expectedChipIds = ['photos', 'soilProfilePhotos', 'drawings', 'finds', 'samples'];
  const desktopRecordContextText = readTextFile(desktopRecordContextSource);
  const desktopRecordContextTemplateText = readTextFile(desktopRecordContextTemplate);
  const desktopRecordContextSpecText = readTextFile(desktopRecordContextSpec);
  const desktopRecordEvidenceText = readTextFile(desktopRecordEvidenceSource);
  const desktopRecordEvidenceSpecText = readTextFile(desktopRecordEvidenceSpec);
  const desktopDocumentDraftText = readTextFile(desktopDocumentDraftSource);
  const desktopDocumentDraftSpecText = readTextFile(desktopDocumentDraftSpec);
  const mobileDraftContinuationText = readTextFile(mobileDraftContinuationSource);
  const mobileDraftContinuationSpecText = readTextFile(mobileDraftContinuationSpec);
  const mobileRecordEvidenceText = readTextFile(
    'mobile/components/Project/korean-fieldwork-record-evidence.ts'
  );
  const mobileRecordEvidenceSpecText = readTextFile(
    'mobile/components/Project/korean-fieldwork-record-evidence.spec.ts'
  );
  const mobileFieldNotesText = readTextFile(
    'mobile/components/Project/korean-fieldwork-field-notes.ts'
  );
  const mobileFieldNotesSpecText = readTextFile(
    'mobile/components/Project/korean-fieldwork-field-notes.spec.ts'
  );
  const mobileFieldNotePanelText = readTextFile(
    'mobile/components/Project/KoreanFieldworkFieldNotePanel.tsx'
  );
  const mobileFieldNotePanelSpecText = readTextFile(
    'mobile/components/Project/KoreanFieldworkFieldNotePanel.spec.tsx'
  );
  const desktopRecordActionText = readTextFile(desktopSource);
  const desktopRecordActionSpecText = readTextFile(
    'desktop/test/unit/util/korean-fieldwork-record-actions.spec.ts'
  );
  const evidenceMetricLabels = [
    '피트',
    '토색 메모',
    '사진',
    '토층사진',
    '도면',
    '약도·스케치',
    '야장 메모',
    '스케치 메모',
    '유물',
    '시료'
  ];

  if (desktopCategories.includes('PenMemo')) {
    findings.push('desktop missing-evidence priority must not treat PenMemo as evidence');
  }
  if (desktopScopeEvidenceCategories.includes('PenMemo')) {
    findings.push('desktop scope evidence count must not treat PenMemo as core evidence');
  }

  if (JSON.stringify(desktopChipIds) !== JSON.stringify(expectedChipIds)) {
    findings.push(
      `desktop missing-evidence priority mismatch: ${desktopChipIds.join(',')}`
    );
  }

  if (JSON.stringify(mobileChipIds) !== JSON.stringify(expectedChipIds)) {
    findings.push(
      `tablet missing-evidence priority mismatch: ${mobileChipIds.join(',')}`
    );
  }
  if (!desktopRecordActionText.includes('makeKoreanFieldworkEvidenceReview')) {
    findings.push('desktop record actions must use expanded evidence review issues, including tablet PenMemo transcription backlog');
  }
  if (!desktopRecordActionSpecText.includes('tablet handwriting PenMemo transcription')
      || !desktopRecordActionSpecText.includes('스케치 메모 1획/1점')
      || !desktopRecordActionSpecText.includes('pen-memo-handwriting-transcription')) {
    findings.push('desktop record actions test must cover tablet handwriting PenMemo transcription backlog');
  }
  if (!desktopRecordContextSpecText.includes('openable record action')
      || !desktopRecordContextSpecText.includes('스케치 메모 1획/1점')
      || !desktopRecordContextSpecText.includes('pen-memo-handwriting-transcription')) {
    findings.push('desktop record context panel test must prove tablet PenMemo backlog is an openable action');
  }

  if (!desktopRecordContextText.includes('getKoreanFieldworkEvidenceChips')
      || !desktopRecordEvidenceText.includes('KoreanFieldworkEvidenceChip')) {
    findings.push('desktop record context panel must reuse shared record evidence chips');
  }
  if (!desktopRecordContextTemplateText.includes('자료 확인')) {
    findings.push('desktop record context panel must render evidence metric heading');
  }
  for (const label of evidenceMetricLabels) {
    if (!desktopRecordContextText.includes(label) && !desktopRecordEvidenceText.includes(label)) {
      findings.push(`desktop record context evidence metric missing label: ${label}`);
    }
  }
  if (!desktopRecordEvidenceSpecText.includes('summarizes field evidence attached to a feature record')
      || !desktopRecordEvidenceSpecText.includes('keeps non-structural evidence records compact')) {
    findings.push('desktop record evidence tests must mirror tablet evidence-chip coverage');
  }
  for (const [label, text] of [
    ['tablet record evidence source', mobileRecordEvidenceText],
    ['desktop record evidence source', desktopRecordEvidenceText]
  ]) {
    if (!text.includes("id: 'sketches'")
        || !text.includes('약도·스케치')
        || !text.includes('penMemos')) {
      findings.push(`${label} must expose PenMemo as a visible sketch evidence chip`);
    }
  }
  for (const [label, text] of [
    ['tablet record evidence test', mobileRecordEvidenceSpecText],
    ['desktop record evidence test', desktopRecordEvidenceSpecText]
  ]) {
    if (!text.includes("id: 'sketches'")
        || !text.includes('약도·스케치')
        || (!text.includes('PenMemo') && !text.includes('C.PEN_MEMO'))) {
      findings.push(`${label} must cover the visible sketch evidence chip`);
    }
  }
  if (!mobileFieldNotesText.includes("'sketches'")
      || !mobileFieldNotesText.includes('약도·스케치')
      || !mobileFieldNotesText.includes('/스케치|약도|손그림|약측|그림/')
      || !mobileFieldNotesSpecText.includes("'sketches'")
      || !mobileFieldNotePanelText.includes("case 'sketches'")
      || !mobileFieldNotePanelSpecText.includes('fieldNoteFollowUpAction_sketches')) {
    findings.push('tablet field notes must make sketches a first-class follow-up evidence action');
  }
  if (mobileFieldNotesText.includes('pattern: /사진|촬영|전경|세부|보강/')) {
    findings.push('tablet field note photo follow-up must not treat generic 보강 as photo evidence');
  }
  for (const categoryToken of ['FEATURE', 'FEATURE_SEGMENT']) {
    if (!new RegExp(
      `\\[CATEGORIES\\.${categoryToken}\\]: \\[[\\s\\S]*?CATEGORIES\\.DRAWING,[\\s\\S]*?CATEGORIES\\.PEN_MEMO,[\\s\\S]*?CATEGORIES\\.FIND`
    ).test(desktopDocumentDraftText)) {
      findings.push(`desktop continuation priority must keep PenMemo before finds/samples for ${categoryToken}`);
    }
    if (!new RegExp(
      `\\[C\\.${categoryToken}\\]: \\[[\\s\\S]*?C\\.DRAWING,[\\s\\S]*?C\\.PEN_MEMO,[\\s\\S]*?C\\.FIND`
    ).test(mobileDraftContinuationText)) {
      findings.push(`tablet continuation priority must keep PenMemo before finds/samples for ${categoryToken}`);
    }
  }
  if (!desktopDocumentDraftSpecText.includes('keeps sketch memos visible before finds and samples')) {
    findings.push('desktop document draft tests must prove sketch memos remain visible before finds and samples');
  }
  if (!mobileDraftContinuationSpecText.includes('prefers sketch memos before finds and samples')) {
    findings.push('tablet draft continuation tests must prove sketch memos are preferred before finds and samples');
  }
  for (const label of ['토색 메모', '사진', '피트', '야장 메모', '스케치 메모']) {
    if (!desktopRecordContextSpecText.includes(label)) {
      findings.push(`desktop record context test must cover evidence metric: ${label}`);
    }
  }

  return findings;
}

function validateRecordEmptyStateGuidance() {
  const findings = [];
  const tabletText = readTextFile('mobile/components/Project/korean-fieldwork-record-list-empty-state.ts');
  const tabletRecordActionText = readTextFile('mobile/components/Project/KoreanFieldworkRecordActionPanel.tsx');
  const desktopText = readTextFile('desktop/src/app/components/resources/korean-fieldwork-priority-strip.component.ts');
  const desktopTemplateText = readTextFile('desktop/src/app/components/resources/korean-fieldwork-priority-strip.html');
  const desktopRecordContextText = readTextFile(
    'desktop/src/app/components/docedit/core/korean-fieldwork-record-context-panel.html'
  );
  const emptyRecordActionDetail = '현재 기록에서 바로 이어갈 필수 작업은 없습니다.';

  for (const title of [
    '아직 기록이 없습니다',
    '검색 결과가 없습니다',
    '선택한 조건에 맞는 기록이 없습니다',
    '표시할 기록이 없습니다'
  ]) {
    if (!tabletText.includes(title)) {
      findings.push(`tablet record list empty-state title missing: ${title}`);
    }
  }

  for (const title of [
    '확인 필요 기록이 없습니다',
    '조사 중 기록이 없습니다',
    '자료 보강 대상이 없습니다',
    '오늘 작성 기록이 없습니다',
    '표시할 기록 작업이 없습니다'
  ]) {
    if (!desktopText.includes(title)) {
      findings.push(`desktop record work empty-state title missing: ${title}`);
    }
  }

  if (!desktopTemplateText.includes('getFilteredRecordWorkEmptyState().detail')) {
    findings.push('desktop record work empty state must render a detail message');
  }

  if (!tabletRecordActionText.includes(emptyRecordActionDetail)) {
    findings.push('tablet record action panel missing no-immediate-action guidance');
  }
  if (!desktopRecordContextText.includes(emptyRecordActionDetail)) {
    findings.push('desktop record context panel missing no-immediate-action guidance');
  }

  return findings;
}

function mapEvidenceCategoryToChipId(categoryName) {
  switch (categoryName) {
    case 'Photo':
      return 'photos';
    case 'SoilProfilePhoto':
      return 'soilProfilePhotos';
    case 'Drawing':
      return 'drawings';
    case 'Find':
      return 'finds';
    case 'Sample':
      return 'samples';
    default:
      return categoryName;
  }
}

function compareStringSets(leftValues, rightValues, leftMissingMessage, rightMissingMessage) {
  const findings = [];

  for (const value of rightValues) {
    if (!leftValues.includes(value)) {
      findings.push(`${leftMissingMessage}: ${value}`);
    }
  }
  for (const value of leftValues) {
    if (!rightValues.includes(value)) {
      findings.push(`${rightMissingMessage}: ${value}`);
    }
  }

  return findings;
}

function collectGuidedFeatureAttributeFieldValues() {
  const result = {};

  for (const source of [
    extractTabletFeatureAttributes(),
    extractDesktopFeatureAttributes()
  ]) {
    for (const featureFields of Object.values(source)) {
      for (const [fieldName, valueIds] of Object.entries(featureFields)) {
        result[fieldName] = sortUnique([
          ...(result[fieldName] || []),
          ...valueIds
        ]);
      }
    }
  }

  return result;
}

function extractFeatureTypeOptions(filePath, arrayName, interpretationPropertyName) {
  const text = readTextFile(filePath);
  const result = {};

  for (const objectText of extractTopLevelArrayObjects(text, arrayName)) {
    const featureType = extractStringProperty(objectText, 'featureType')
      || extractStringProperty(objectText, 'value');

    if (!featureType) continue;

    result[featureType] = {
      interpretationValue: extractStringProperty(
        objectText,
        interpretationPropertyName
      )
    };
  }

  return result;
}

function extractTabletFeatureAttributes() {
  const text = readTextFile(
    'mobile/components/Project/korean-fieldwork-feature-attributes.ts'
  );
  const result = {};
  const typePattern = /^  ([A-Za-z0-9_]+): \[([\s\S]*?)^  \],?/gm;
  let typeMatch;

  while ((typeMatch = typePattern.exec(text)) !== null) {
    result[typeMatch[1]] = extractFieldValueGroups(typeMatch[2], 'options');
  }

  return result;
}

function extractTabletFeatureAttributeLabels() {
  const text = readTextFile(
    'mobile/components/Project/korean-fieldwork-feature-attributes.ts'
  );
  const result = {};
  const typePattern = /^  ([A-Za-z0-9_]+): \[([\s\S]*?)^  \],?/gm;
  let typeMatch;

  while ((typeMatch = typePattern.exec(text)) !== null) {
    result[typeMatch[1]] = extractFieldValueLabels(typeMatch[2]);
  }

  return result;
}

function extractDesktopFeatureAttributes() {
  const text = readTextFile(
    'desktop/src/app/util/korean-fieldwork-feature-guidance.ts'
  );
  const result = {};

  for (const objectText of extractTopLevelArrayObjects(
    text,
    'KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS'
  )) {
    const featureType = extractStringProperty(objectText, 'featureType');
    if (!featureType) continue;

    result[featureType] = extractFieldValueGroups(objectText, 'valueIds');
  }

  return result;
}

function extractGuidedFeatureConfigLabels() {
  const config = readJsonFile('core/config/Config-KoreanFieldwork.json');
  const koreanLabels = readJsonFile('core/config/Library/Valuelists/Language.projects.ko.json');
  const valuelistByField = config.forms?.['Feature:default']?.valuelists ?? {};
  const fieldValues = collectGuidedFeatureAttributeFieldValues();
  const result = {};

  for (const fieldName of Object.keys(fieldValues)) {
    const valuelistId = valuelistByField[fieldName];
    const values = koreanLabels[valuelistId]?.values ?? {};

    result[fieldName] = {};
    for (const valueId of fieldValues[fieldName]) {
      if (values[valueId]?.label) {
        result[fieldName][valueId] = values[valueId].label;
      }
    }
  }

  return result;
}

function extractFieldValueGroups(text, valuesPropertyName) {
  const result = {};
  const pattern = new RegExp(
    `fieldName: '([^']+)'[\\s\\S]*?${valuesPropertyName}: \\[([\\s\\S]*?)\\n\\s*\\]`,
    'g'
  );
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const valuePattern = valuesPropertyName === 'options'
      ? /value: '([^']+)'/g
      : /'([^']+)'/g;

    result[match[1]] = sortUnique(
      Array.from(match[2].matchAll(valuePattern))
        .map((valueMatch) => valueMatch[1])
    );
  }

  return result;
}

function extractFieldValueLabels(text) {
  const result = {};
  const pattern = new RegExp(
    `fieldName: '([^']+)'[\\s\\S]*?options: \\[([\\s\\S]*?)\\n\\s*\\]`,
    'g'
  );
  let match;

  while ((match = pattern.exec(text)) !== null) {
    result[match[1]] = {};

    for (const optionMatch of match[2].matchAll(/value: '([^']+)', label: '([^']+)'/g)) {
      result[match[1]][optionMatch[1]] = optionMatch[2];
    }
  }

  return result;
}

function areCompatibleKoreanFieldworkDisplayLabels(tabletLabel, configLabel) {
  const normalizedTabletLabel = normalizeKoreanFieldworkDisplayLabel(tabletLabel);
  const normalizedConfigLabel = normalizeKoreanFieldworkDisplayLabel(configLabel);

  return normalizedTabletLabel === normalizedConfigLabel
    || normalizedConfigLabel.startsWith(normalizedTabletLabel);
}

function normalizeKoreanFieldworkDisplayLabel(label) {
  return label
    .replace(/\s+/g, '')
    .replace(/(기록|확인|조사|주의)$/, '');
}

function extractTopLevelArrayObjects(text, arrayName) {
  const markerIndex = text.indexOf(arrayName);
  if (markerIndex === -1) return [];

  const assignmentIndex = text.indexOf('=', markerIndex);
  if (assignmentIndex === -1) return [];

  const arrayStart = text.indexOf('[', assignmentIndex);
  if (arrayStart === -1) return [];

  const objects = [];
  let braceDepth = 0;
  let objectStart = -1;
  let inString = false;
  let quote = '';
  let escaped = false;

  for (let index = arrayStart + 1; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        inString = false;
      }
      continue;
    }

    if (char === '\'' || char === '"' || char === '`') {
      inString = true;
      quote = char;
      continue;
    }

    if (char === '{') {
      if (braceDepth === 0) objectStart = index;
      braceDepth += 1;
    } else if (char === '}') {
      braceDepth -= 1;
      if (braceDepth === 0 && objectStart >= 0) {
        objects.push(text.slice(objectStart, index + 1));
      }
    } else if (char === ']' && braceDepth === 0) {
      break;
    }
  }

  return objects;
}

function extractStringCollection(filePath, markerName) {
  const text = readTextFile(filePath);
  const markerIndex = text.indexOf(markerName);
  if (markerIndex === -1) return [];

  const arrayStart = text.indexOf('[', markerIndex);
  if (arrayStart === -1) return [];

  const arrayEnd = findMatchingSquareBracket(text, arrayStart);
  if (arrayEnd === -1) return [];

  return sortUnique(
    Array.from(text.slice(arrayStart + 1, arrayEnd).matchAll(/'([^']+)'/g))
      .map((match) => match[1])
  );
}

function extractStringCollectionInOrder(filePath, markerName) {
  const text = readTextFile(filePath);
  const markerIndex = text.indexOf(markerName);
  if (markerIndex === -1) return [];

  const arrayStart = text.indexOf('[', markerIndex);
  if (arrayStart === -1) return [];

  const arrayEnd = findMatchingSquareBracket(text, arrayStart);
  if (arrayEnd === -1) return [];

  return Array.from(text.slice(arrayStart + 1, arrayEnd).matchAll(/'([^']+)'/g))
    .map((match) => match[1]);
}

function findMatchingSquareBracket(text, startIndex) {
  let depth = 0;
  let inString = false;
  let quote = '';
  let escaped = false;

  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        inString = false;
      }
      continue;
    }

    if (char === '\'' || char === '"' || char === '`') {
      inString = true;
      quote = char;
      continue;
    }

    if (char === '[') {
      depth += 1;
    } else if (char === ']') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
}

function extractStringProperty(text, propertyName) {
  const pattern = new RegExp(`${propertyName}: '([^']+)'`);
  return text.match(pattern)?.[1];
}

function readTextFile(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

function readJsonFile(filePath) {
  return JSON.parse(readTextFile(filePath));
}

function sortUnique(values) {
  return Array.from(new Set(values)).sort();
}

function printReport(
  missingRows,
  missingCoverageRows,
  untrackedFiles,
  unstagedFiles,
  investigationModeFindings,
  guidedFindings,
  guidedFeatureConfigFindings,
  projectStartSequenceFindings,
  projectSettingsFindings,
  projectInvestigationModeWordingFindings,
  priorityTaskFindings,
  rawFormFindings,
  recordPanelOrderFindings,
  connectedRecordWordingFindings,
  scopeMetricWordingFindings,
  soilColorReviewFindings,
  progressModeFindings,
  recordActionFindings,
  recordEmptyStateFindings,
  verificationCoverageFindings,
  sourceInventoryFindings,
  supportInventoryFindings
) {
  console.log('Korean fieldwork desktop-tablet parity check');
  console.log('');
  console.log('Feature rows:');

  for (const row of featureRows) {
    const hasIssue = missingRows.some((candidate) => candidate.row.id === row.id);
    console.log(`- ${hasIssue ? 'MISSING' : 'OK'} ${row.id}: ${row.title}`);
  }

  console.log('');

  if (missingRows.length === 0) {
    console.log('No missing counterpart files were found.');
  } else {
    console.log('Missing counterpart files:');
    for (const entry of missingRows) {
      for (const filePath of entry.missingTablet) {
        console.log(`- tablet missing for ${entry.row.id}: ${filePath}`);
      }
      for (const filePath of entry.missingDesktop) {
        console.log(`- desktop missing for ${entry.row.id}: ${filePath}`);
      }
    }
  }

  console.log('');

  if (missingCoverageRows.length === 0) {
    console.log('Every feature row has tablet and desktop test coverage files.');
  } else {
    console.log('Missing feature-row test coverage files:');
    for (const entry of missingCoverageRows) {
      for (const filePath of entry.missingTabletTests) {
        console.log(`- tablet test missing for ${entry.row.id}: ${filePath}`);
      }
      for (const filePath of entry.missingDesktopTests) {
        console.log(`- desktop test missing for ${entry.row.id}: ${filePath}`);
      }
    }
  }

  console.log('');

  if (sourceInventoryFindings.length === 0) {
    console.log('Every Korean fieldwork source file is assigned to a feature row or support inventory.');
  } else {
    console.log('Korean fieldwork source files need feature-row or support classification:');
    for (const filePath of sourceInventoryFindings) {
      console.log(`- ${filePath}`);
    }
  }

  console.log('');

  if (supportInventoryFindings.length === 0) {
    console.log('Every support inventory entry has a reason and an existing source file.');
  } else {
    console.log('Support inventory classification issues:');
    for (const finding of supportInventoryFindings) {
      console.log(`- ${finding}`);
    }
  }

  console.log('');

  if (verificationCoverageFindings.length === 0) {
    console.log('The default Korean fieldwork verifier includes every feature-row coverage test.');
  } else {
    console.log('Korean fieldwork verifier coverage gaps:');
    for (const finding of verificationCoverageFindings) {
      console.log(`- ${finding}`);
    }
  }

  console.log('');

  if (investigationModeFindings.length === 0) {
    console.log('No investigation mode definition mismatches were found.');
  } else {
    console.log('Investigation mode definition mismatches:');
    for (const finding of investigationModeFindings) {
      console.log(`- ${finding}`);
    }
  }

  console.log('');

  if (guidedFindings.length === 0) {
    console.log('No guided feature definition mismatches were found.');
  } else {
    console.log('Guided feature definition mismatches:');
    for (const finding of guidedFindings) {
      console.log(`- ${finding}`);
    }
  }

  console.log('');

  if (guidedFeatureConfigFindings.length === 0) {
    console.log('No guided feature configuration or valuelist gaps were found.');
  } else {
    console.log('Guided feature configuration or valuelist gaps:');
    for (const finding of guidedFeatureConfigFindings) {
      console.log(`- ${finding}`);
    }
  }

  console.log('');

  if (projectStartSequenceFindings.length === 0) {
    console.log('No project start-sequence gaps were found.');
  } else {
    console.log('Project start-sequence gaps:');
    for (const finding of projectStartSequenceFindings) {
      console.log(`- ${finding}`);
    }
  }

  console.log('');

  if (projectSettingsFindings.length === 0) {
    console.log('No project settings completeness gaps were found.');
  } else {
    console.log('Project settings completeness gaps:');
    for (const finding of projectSettingsFindings) {
      console.log(`- ${finding}`);
    }
  }

  console.log('');

  if (projectInvestigationModeWordingFindings.length === 0) {
    console.log('No project investigation-mode wording gaps were found.');
  } else {
    console.log('Project investigation-mode wording gaps:');
    for (const finding of projectInvestigationModeWordingFindings) {
      console.log(`- ${finding}`);
    }
  }

  console.log('');

  if (priorityTaskFindings.length === 0) {
    console.log('No shared priority task id gaps were found.');
  } else {
    console.log('Shared priority task id gaps:');
    for (const finding of priorityTaskFindings) {
      console.log(`- ${finding}`);
    }
  }

  console.log('');

  if (rawFormFindings.length === 0) {
    console.log('No raw-form hiding rule gaps were found.');
  } else {
    console.log('Raw-form hiding rule gaps:');
    for (const finding of rawFormFindings) {
      console.log(`- ${finding}`);
    }
  }

  console.log('');

  if (recordPanelOrderFindings.length === 0) {
    console.log('No record panel order gaps were found.');
  } else {
    console.log('Record panel order gaps:');
    for (const finding of recordPanelOrderFindings) {
      console.log(`- ${finding}`);
    }
  }

  console.log('');

  if (connectedRecordWordingFindings.length === 0) {
    console.log('No connected-record wording gaps were found.');
  } else {
    console.log('Connected-record wording gaps:');
    for (const finding of connectedRecordWordingFindings) {
      console.log(`- ${finding}`);
    }
  }

  console.log('');

  if (scopeMetricWordingFindings.length === 0) {
    console.log('No scope metric wording gaps were found.');
  } else {
    console.log('Scope metric wording gaps:');
    for (const finding of scopeMetricWordingFindings) {
      console.log(`- ${finding}`);
    }
  }

  console.log('');

  if (soilColorReviewFindings.length === 0) {
    console.log('No soil-color review workflow gaps were found.');
  } else {
    console.log('Soil-color review workflow gaps:');
    for (const finding of soilColorReviewFindings) {
      console.log(`- ${finding}`);
    }
  }

  console.log('');

  if (progressModeFindings.length === 0) {
    console.log('No progress mode-awareness gaps were found.');
  } else {
    console.log('Progress mode-awareness gaps:');
    for (const finding of progressModeFindings) {
      console.log(`- ${finding}`);
    }
  }

  console.log('');

  if (recordActionFindings.length === 0) {
    console.log('No record action evidence-priority gaps were found.');
  } else {
    console.log('Record action evidence-priority gaps:');
    for (const finding of recordActionFindings) {
      console.log(`- ${finding}`);
    }
  }

  console.log('');

  if (recordEmptyStateFindings.length === 0) {
    console.log('No record empty-state guidance gaps were found.');
  } else {
    console.log('Record empty-state guidance gaps:');
    for (const finding of recordEmptyStateFindings) {
      console.log(`- ${finding}`);
    }
  }

  console.log('');

  if (untrackedFiles.length === 0) {
    console.log('No release-critical untracked files were found.');
  } else {
    console.log('Release-critical files are untracked:');
    for (const filePath of untrackedFiles) {
      console.log(`- ${filePath}`);
    }
  }

  console.log('');

  if (unstagedFiles.length === 0) {
    console.log('No release-critical unstaged changes were found.');
  } else {
    console.log('Release-critical files have unstaged changes:');
    for (const filePath of unstagedFiles) {
      console.log(`- ${filePath}`);
    }
  }

  if (
    reportOnly
    && (
      missingRows.length > 0
      || missingCoverageRows.length > 0
      || untrackedFiles.length > 0
      || unstagedFiles.length > 0
      || investigationModeFindings.length > 0
      || guidedFindings.length > 0
      || guidedFeatureConfigFindings.length > 0
      || projectStartSequenceFindings.length > 0
      || projectSettingsFindings.length > 0
      || projectInvestigationModeWordingFindings.length > 0
      || priorityTaskFindings.length > 0
      || rawFormFindings.length > 0
      || recordPanelOrderFindings.length > 0
      || connectedRecordWordingFindings.length > 0
      || scopeMetricWordingFindings.length > 0
      || soilColorReviewFindings.length > 0
      || progressModeFindings.length > 0
      || recordActionFindings.length > 0
      || recordEmptyStateFindings.length > 0
      || verificationCoverageFindings.length > 0
      || sourceInventoryFindings.length > 0
      || supportInventoryFindings.length > 0
    )
  ) {
    console.log('');
    console.log('Report-only mode: findings were reported without failing the command.');
  }
}
