import {
  act,
  renderHook,
  waitFor,
} from '@testing-library/react-native';
import * as FileSystem from 'expo-file-system';
import { SyncStatus, base64Encode } from 'idai-field-core';
import useFieldworkImageSync, {
  buildFieldworkImageUploadUrl,
  collectFieldworkImageSyncTargets,
  getFieldworkImageUploadRecordUpdates,
  getFieldworkImageUploadMetadata,
  getFieldworkImageStoredMetadata,
  getFieldHubBaseUrl,
  recordFieldworkImageUpload,
} from './use-fieldwork-image-sync';

jest.mock('expo-file-system', () => ({
  FileSystemUploadType: {
    BINARY_CONTENT: 'BINARY_CONTENT',
  },
  getInfoAsync: jest.fn(),
  uploadAsync: jest.fn(),
}));

describe('useFieldworkImageSync', () => {
  const projectSettings = {
    connected: true,
    mapSettings: { pointRadius: 6 },
    password: 'field-secret',
    url: 'https://field.example/db',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      isDirectory: false,
      md5: 'tablet-md5',
      size: 481516,
    });
    (FileSystem.uploadAsync as jest.Mock).mockResolvedValue({
      body: JSON.stringify({
        md5: 'tablet-md5',
        sha256: 'server-sha256',
        size_bytes: 481516,
      }),
      status: 201,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('uploads local photo records to the Field Hub original image store', async () => {
    renderHook(() => useFieldworkImageSync({
      documents: [
        createDocument('photo-1', 'Photo', {
          fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
        }),
        createDocument('soil-photo-1', 'SoilProfilePhoto', {
          soilProfilePhotoUri: 'file:///tablet/photos/soil-photo-1.jpg',
        }),
        createDocument('feature-1', 'Feature', {}),
      ] as any,
      project: 'fieldwork',
      projectSettings,
      syncStatus: SyncStatus.InSync,
    }));

    await waitFor(() => {
      expect(FileSystem.uploadAsync).toHaveBeenCalledTimes(2);
    });

    expect(FileSystem.uploadAsync).toHaveBeenNthCalledWith(
      1,
      'https://field.example/files/fieldwork/photo-1?type=original_image',
      'file:///tablet/photos/photo-1.jpg',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Basic ${base64Encode('fieldwork:field-secret')}`,
        }),
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      })
    );
    expect(FileSystem.uploadAsync).toHaveBeenNthCalledWith(
      2,
      'https://field.example/files/fieldwork/soil-photo-1?type=original_image',
      'file:///tablet/photos/soil-photo-1.jpg',
      expect.any(Object)
    );
  });

  it('records successful uploads on the document for later report work', async () => {
    const document = createDocument('photo-1', 'Photo', {
      digitalSourcePreservation: ['unpublishedPhotoRetained'],
      fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
    });
    const repository = {
      get: jest.fn().mockResolvedValue(document),
      update: jest.fn(async (doc) => doc),
    };

    renderHook(() => useFieldworkImageSync({
      documents: [document] as any,
      getUploadedAt: () => '2026-06-23T01:02:03.000Z',
      project: 'fieldwork',
      projectSettings,
      repository,
      syncStatus: SyncStatus.InSync,
    }));

    await waitFor(() => {
      expect(repository.update).toHaveBeenCalledTimes(1);
    });

    expect(repository.get).toHaveBeenCalledWith('photo-1');
    expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({
      resource: expect.objectContaining({
        digitalSourcePreservation: [
          'unpublishedPhotoRetained',
          'originalPhoto',
          'originalImage',
          'webOrServerBackup',
          'backupVerified',
        ],
        fieldworkImageUploadStatus: 'uploaded',
        fieldworkImageUploadedAt: '2026-06-23T01:02:03.000Z',
        fieldworkImageUploadedUri: 'file:///tablet/photos/photo-1.jpg',
        fieldworkImageUploadTarget:
          'https://field.example/files/fieldwork/photo-1?type=original_image',
        fieldworkImageUploadedProject: 'fieldwork',
        fieldworkImageUploadedSizeBytes: 481516,
        fieldworkImageUploadedMd5: 'tablet-md5',
        fieldworkImageStoredSizeBytes: 481516,
        fieldworkImageStoredMd5: 'tablet-md5',
        fieldworkImageStoredSha256: 'server-sha256',
      }),
    }));
  });

  it('records Field Hub stored metadata for content URI uploads', async () => {
    const document = createDocument('drawing-1', 'Drawing', {
      fileUri: 'content://tablet/drawings/drawing-1.jpg',
    });
    const repository = {
      get: jest.fn().mockResolvedValue(document),
      update: jest.fn(async (doc) => doc),
    };

    renderHook(() => useFieldworkImageSync({
      documents: [document] as any,
      getUploadedAt: () => '2026-06-23T01:02:03.000Z',
      project: 'fieldwork',
      projectSettings,
      repository,
      syncStatus: SyncStatus.InSync,
    }));

    await waitFor(() => {
      expect(repository.update).toHaveBeenCalledTimes(1);
    });

    const updatedDocument = repository.update.mock.calls[0][0];
    expect(FileSystem.getInfoAsync).not.toHaveBeenCalled();
    expect(updatedDocument.resource).toMatchObject({
      digitalSourcePreservation: [
        'originalDrawing',
        'webOrServerBackup',
        'backupVerified',
      ],
      fieldworkImageUploadStatus: 'uploaded',
      fieldworkImageUploadedUri: 'content://tablet/drawings/drawing-1.jpg',
      fieldworkImageUploadTarget:
        'https://field.example/files/fieldwork/drawing-1?type=original_image',
      fieldworkImageUploadedProject: 'fieldwork',
      fieldworkImageStoredSizeBytes: 481516,
      fieldworkImageStoredMd5: 'tablet-md5',
      fieldworkImageStoredSha256: 'server-sha256',
    });
    expect(updatedDocument.resource.fieldworkImageUploadedSizeBytes).toBeUndefined();
    expect(updatedDocument.resource.fieldworkImageUploadedMd5).toBeUndefined();
  });

  it('does not reupload images already recorded for the same Field Hub target', async () => {
    const document = createDocument('photo-1', 'Photo', {
      fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
      digitalSourcePreservation: [
        'originalPhoto',
        'originalImage',
        'webOrServerBackup',
        'backupVerified',
      ],
      fieldworkImageUploadStatus: 'uploaded',
      fieldworkImageUploadedAt: '2026-06-23T01:02:03.000Z',
      fieldworkImageUploadedUri: 'file:///tablet/photos/photo-1.jpg',
      fieldworkImageUploadTarget:
        'https://field.example/files/fieldwork/photo-1?type=original_image',
      fieldworkImageUploadedProject: 'fieldwork',
      fieldworkImageUploadedSizeBytes: 481516,
      fieldworkImageUploadedMd5: 'tablet-md5',
      fieldworkImageStoredSizeBytes: 481516,
      fieldworkImageStoredMd5: 'tablet-md5',
      fieldworkImageStoredSha256: 'server-sha256',
    });
    const repository = {
      get: jest.fn(),
      update: jest.fn(),
    };

    renderHook(() => useFieldworkImageSync({
      documents: [document] as any,
      project: 'fieldwork',
      projectSettings,
      repository,
      syncStatus: SyncStatus.InSync,
    }));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(FileSystem.uploadAsync).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('completes partial upload records without reuploading the original image', async () => {
    const document = createDocument('photo-1', 'Photo', {
      fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
      fieldworkImageUploadStatus: 'uploaded',
      fieldworkImageUploadedAt: '2026-06-23T01:02:03.000Z',
      fieldworkImageUploadedUri: 'file:///tablet/photos/photo-1.jpg',
      fieldworkImageUploadTarget:
        'https://field.example/files/fieldwork/photo-1?type=original_image',
      fieldworkImageUploadedProject: 'fieldwork',
      fieldworkImageUploadedSizeBytes: 481516,
      fieldworkImageUploadedMd5: 'tablet-md5',
      fieldworkImageStoredSizeBytes: 481516,
      fieldworkImageStoredMd5: 'tablet-md5',
      fieldworkImageStoredSha256: 'server-sha256',
    });
    const repository = {
      get: jest.fn().mockResolvedValue(document),
      update: jest.fn(async (doc) => doc),
    };

    renderHook(() => useFieldworkImageSync({
      documents: [document] as any,
      getUploadedAt: () => '2027-01-01T00:00:00.000Z',
      project: 'fieldwork',
      projectSettings,
      repository,
      syncStatus: SyncStatus.InSync,
    }));

    await waitFor(() => {
      expect(repository.update).toHaveBeenCalledTimes(1);
    });

    expect(FileSystem.uploadAsync).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({
      resource: expect.objectContaining({
        digitalSourcePreservation: [
          'originalPhoto',
          'originalImage',
          'webOrServerBackup',
          'backupVerified',
        ],
        fieldworkImageUploadedAt: '2026-06-23T01:02:03.000Z',
      }),
    }));
  });

  it('does not rewrite the latest document when the upload record is already complete', async () => {
    const document = createDocument('photo-1', 'Photo', {
      digitalSourcePreservation: [
        'originalPhoto',
        'originalImage',
        'webOrServerBackup',
        'backupVerified',
      ],
      fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
      fieldworkImageUploadStatus: 'uploaded',
      fieldworkImageUploadedAt: '2026-06-23T01:02:03.000Z',
      fieldworkImageUploadedUri: 'file:///tablet/photos/photo-1.jpg',
      fieldworkImageUploadTarget:
        'https://field.example/files/fieldwork/photo-1?type=original_image',
      fieldworkImageUploadedProject: 'fieldwork',
      fieldworkImageUploadedSizeBytes: 481516,
      fieldworkImageUploadedMd5: 'tablet-md5',
      fieldworkImageStoredSizeBytes: 481516,
      fieldworkImageStoredMd5: 'tablet-md5',
      fieldworkImageStoredSha256: 'server-sha256',
    });
    const repository = {
      get: jest.fn().mockResolvedValue(document),
      update: jest.fn(),
    };

    await expect(recordFieldworkImageUpload({
      getUploadedAt: () => '2027-01-01T00:00:00.000Z',
      project: 'fieldwork',
      repository,
      target: {
        category: 'Photo',
        document: document as any,
        resourceId: 'photo-1',
        uri: 'file:///tablet/photos/photo-1.jpg',
        uploadUrl: 'https://field.example/files/fieldwork/photo-1?type=original_image',
      },
    })).resolves.toBe(document);

    expect(repository.get).toHaveBeenCalledWith('photo-1');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('does not record stale upload audit data when the latest document points to another local file', async () => {
    const latestDocument = createDocument('photo-1', 'Photo', {
      fieldworkPhotoUri: 'file:///tablet/photos/replaced-photo-1.jpg',
    });
    const repository = {
      get: jest.fn().mockResolvedValue(latestDocument),
      update: jest.fn(),
    };

    await expect(recordFieldworkImageUpload({
      getUploadedAt: () => '2027-01-01T00:00:00.000Z',
      project: 'fieldwork',
      repository,
      target: {
        category: 'Photo',
        document: createDocument('photo-1', 'Photo', {
          fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
        }) as any,
        resourceId: 'photo-1',
        uri: 'file:///tablet/photos/photo-1.jpg',
        uploadUrl: 'https://field.example/files/fieldwork/photo-1?type=original_image',
        uploadedMd5: 'tablet-md5',
        uploadedSizeBytes: 481516,
      },
    })).resolves.toBe(latestDocument);

    expect(repository.get).toHaveBeenCalledWith('photo-1');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('retries failed upload audit recording without retrying the binary upload', async () => {
    jest.useFakeTimers();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const document = createDocument('photo-1', 'Photo', {
      fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
    });
    const repository = {
      get: jest.fn().mockRejectedValue(new Error('revision conflict')),
      update: jest.fn(),
    };

    renderHook(() => useFieldworkImageSync({
      documents: [document] as any,
      project: 'fieldwork',
      projectSettings,
      repository,
      retryDelayMs: 10,
      syncStatus: SyncStatus.InSync,
    }));

    await waitFor(() => {
      expect(repository.get).toHaveBeenCalled();
    });

    await act(async () => {
      jest.advanceTimersByTime(10);
    });

    await waitFor(() => {
      expect(repository.get.mock.calls.length).toBeGreaterThan(1);
    });

    expect(FileSystem.uploadAsync).toHaveBeenCalledTimes(1);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('records a successful upload after a transient audit write failure', async () => {
    jest.useFakeTimers();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const document = createDocument('photo-1', 'Photo', {
      fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
    });
    const repository = {
      get: jest.fn()
        .mockRejectedValueOnce(new Error('revision conflict'))
        .mockResolvedValue(document),
      update: jest.fn(async (doc) => doc),
    };

    renderHook(() => useFieldworkImageSync({
      documents: [document] as any,
      getUploadedAt: () => '2026-06-23T01:02:03.000Z',
      project: 'fieldwork',
      projectSettings,
      repository,
      retryDelayMs: 10,
      syncStatus: SyncStatus.InSync,
    }));

    await waitFor(() => {
      expect(repository.get).toHaveBeenCalled();
    });

    await act(async () => {
      jest.advanceTimersByTime(10);
    });

    await waitFor(() => {
      expect(repository.update).toHaveBeenCalledTimes(1);
    });

    expect(FileSystem.uploadAsync).toHaveBeenCalledTimes(1);
    expect(repository.get).toHaveBeenCalledTimes(2);
    expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({
      resource: expect.objectContaining({
        fieldworkImageUploadStatus: 'uploaded',
        fieldworkImageUploadedAt: '2026-06-23T01:02:03.000Z',
        fieldworkImageUploadedSizeBytes: 481516,
        fieldworkImageUploadedMd5: 'tablet-md5',
        fieldworkImageStoredSizeBytes: 481516,
        fieldworkImageStoredMd5: 'tablet-md5',
        fieldworkImageStoredSha256: 'server-sha256',
      }),
    }));
  });

  it('backfills upload file metadata without reuploading already recorded originals', async () => {
    const document = createDocument('photo-1', 'Photo', {
      fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
      digitalSourcePreservation: [
        'originalPhoto',
        'originalImage',
        'webOrServerBackup',
        'backupVerified',
      ],
      fieldworkImageUploadStatus: 'uploaded',
      fieldworkImageUploadedAt: '2026-06-23T01:02:03.000Z',
      fieldworkImageUploadedUri: 'file:///tablet/photos/photo-1.jpg',
      fieldworkImageUploadTarget:
        'https://field.example/files/fieldwork/photo-1?type=original_image',
      fieldworkImageUploadedProject: 'fieldwork',
      fieldworkImageStoredSizeBytes: 481516,
      fieldworkImageStoredMd5: 'tablet-md5',
      fieldworkImageStoredSha256: 'server-sha256',
    });
    const repository = {
      get: jest.fn().mockResolvedValue(document),
      update: jest.fn(async (doc) => doc),
    };

    renderHook(() => useFieldworkImageSync({
      documents: [document] as any,
      getUploadedAt: () => '2027-01-01T00:00:00.000Z',
      project: 'fieldwork',
      projectSettings,
      repository,
      syncStatus: SyncStatus.InSync,
    }));

    await waitFor(() => {
      expect(repository.update).toHaveBeenCalledTimes(1);
    });

    expect(FileSystem.uploadAsync).not.toHaveBeenCalled();
    expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(
      'file:///tablet/photos/photo-1.jpg',
      { md5: true }
    );
    expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({
      resource: expect.objectContaining({
        fieldworkImageUploadedAt: '2026-06-23T01:02:03.000Z',
        fieldworkImageUploadedMd5: 'tablet-md5',
        fieldworkImageUploadedSizeBytes: 481516,
      }),
    }));
  });

  it('backfills upload sizes without reuploading already checksummed originals', async () => {
    const document = createDocument('photo-1', 'Photo', {
      fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
      digitalSourcePreservation: [
        'originalPhoto',
        'originalImage',
        'webOrServerBackup',
        'backupVerified',
      ],
      fieldworkImageUploadStatus: 'uploaded',
      fieldworkImageUploadedAt: '2026-06-23T01:02:03.000Z',
      fieldworkImageUploadedUri: 'file:///tablet/photos/photo-1.jpg',
      fieldworkImageUploadTarget:
        'https://field.example/files/fieldwork/photo-1?type=original_image',
      fieldworkImageUploadedProject: 'fieldwork',
      fieldworkImageUploadedMd5: 'tablet-md5',
      fieldworkImageStoredSizeBytes: 481516,
      fieldworkImageStoredMd5: 'tablet-md5',
      fieldworkImageStoredSha256: 'server-sha256',
    });
    const repository = {
      get: jest.fn().mockResolvedValue(document),
      update: jest.fn(async (doc) => doc),
    };

    renderHook(() => useFieldworkImageSync({
      documents: [document] as any,
      getUploadedAt: () => '2027-01-01T00:00:00.000Z',
      project: 'fieldwork',
      projectSettings,
      repository,
      syncStatus: SyncStatus.InSync,
    }));

    await waitFor(() => {
      expect(repository.update).toHaveBeenCalledTimes(1);
    });

    expect(FileSystem.uploadAsync).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({
      resource: expect.objectContaining({
        fieldworkImageUploadedAt: '2026-06-23T01:02:03.000Z',
        fieldworkImageUploadedMd5: 'tablet-md5',
        fieldworkImageUploadedSizeBytes: 481516,
      }),
    }));
  });

  it('waits until the project is connected and pouch sync has reached the server', async () => {
    renderHook(() => useFieldworkImageSync({
      documents: [
        createDocument('photo-1', 'Photo', {
          fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
        }),
      ] as any,
      project: 'fieldwork',
      projectSettings,
      syncStatus: SyncStatus.Offline,
    }));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(FileSystem.uploadAsync).not.toHaveBeenCalled();
  });

  it('retries failed image uploads while sync remains available', async () => {
    jest.useFakeTimers();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (FileSystem.uploadAsync as jest.Mock)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ status: 201 });

    renderHook(() => useFieldworkImageSync({
      documents: [
        createDocument('photo-1', 'Photo', {
          fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
        }),
      ] as any,
      project: 'fieldwork',
      projectSettings,
      retryDelayMs: 10,
      syncStatus: SyncStatus.InSync,
    }));

    await waitFor(() => {
      expect(FileSystem.uploadAsync).toHaveBeenCalledTimes(1);
    });

    jest.advanceTimersByTime(10);

    await waitFor(() => {
      expect(FileSystem.uploadAsync).toHaveBeenCalledTimes(2);
    });
  });

  it('logs failed uploads without leaking credentials', async () => {
    const token = base64Encode('fieldwork:field-secret');
    const uploadError = new Error(
      `offline password=field-secret Authorization: Basic ${token}`
    );
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (FileSystem.uploadAsync as jest.Mock).mockRejectedValueOnce(uploadError);

    renderHook(() => useFieldworkImageSync({
      documents: [
        createDocument('photo-1', 'Photo', {
          fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
        }),
      ] as any,
      project: 'fieldwork',
      projectSettings,
      syncStatus: SyncStatus.InSync,
    }));

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    const [, loggedError] = consoleError.mock.calls[0];
    expect(loggedError).not.toBe(uploadError);
    expect(loggedError).not.toContain('field-secret');
    expect(loggedError).not.toContain(token);
    expect(loggedError).toContain('[redacted]');
  });

  it('uploads newly added image records after the current upload finishes', async () => {
    const firstUpload = createDeferred<{ status: number }>();
    (FileSystem.uploadAsync as jest.Mock)
      .mockImplementationOnce(() => firstUpload.promise)
      .mockResolvedValue({ status: 201 });

    const firstDocument = createDocument('photo-1', 'Photo', {
      fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
    });
    const secondDocument = createDocument('soil-photo-1', 'SoilProfilePhoto', {
      soilProfilePhotoUri: 'file:///tablet/photos/soil-photo-1.jpg',
    });

    const { rerender } = renderHook(
      ({ documents }) => useFieldworkImageSync({
        documents,
        project: 'fieldwork',
        projectSettings,
        syncStatus: SyncStatus.InSync,
      }),
      {
        initialProps: {
          documents: [firstDocument] as any,
        },
      }
    );

    await waitFor(() => {
      expect(FileSystem.uploadAsync).toHaveBeenCalledTimes(1);
    });

    rerender({
      documents: [firstDocument, secondDocument] as any,
    });

    await act(async () => {
      firstUpload.resolve({ status: 201 });
      await firstUpload.promise;
    });

    await waitFor(() => {
      expect(FileSystem.uploadAsync).toHaveBeenCalledTimes(2);
    });

    expect(FileSystem.uploadAsync).toHaveBeenNthCalledWith(
      2,
      'https://field.example/files/fieldwork/soil-photo-1?type=original_image',
      'file:///tablet/photos/soil-photo-1.jpg',
      expect.any(Object)
    );
  });

  it('uploads existing local images again when the Field Hub URL changes', async () => {
    const document = createDocument('photo-1', 'Photo', {
      fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
    });

    const { rerender } = renderHook(
      ({ settings }) => useFieldworkImageSync({
        documents: [document] as any,
        project: 'fieldwork',
        projectSettings: settings,
        syncStatus: SyncStatus.InSync,
      }),
      {
        initialProps: {
          settings: projectSettings,
        },
      }
    );

    await waitFor(() => {
      expect(FileSystem.uploadAsync).toHaveBeenCalledTimes(1);
    });

    rerender({
      settings: {
        ...projectSettings,
        url: 'https://new-field.example/db/fieldwork',
      },
    });

    await waitFor(() => {
      expect(FileSystem.uploadAsync).toHaveBeenCalledTimes(2);
    });

    expect(FileSystem.uploadAsync).toHaveBeenNthCalledWith(
      2,
      'https://new-field.example/files/fieldwork/photo-1?type=original_image',
      'file:///tablet/photos/photo-1.jpg',
      expect.any(Object)
    );
  });

  it('collects uploadable photo, drawing, and soil profile photo records', () => {
    expect(collectFieldworkImageSyncTargets([
      createDocument('photo-1', 'Photo', {
        imageUri: 'https://field.example/existing.jpg',
        fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg',
      }),
      createDocument('drawing-1', 'Drawing', {
        fileUri: 'content://tablet/drawing-1.jpg',
      }),
      createDocument('soil-photo-1', 'SoilProfilePhoto', {
        soilProfilePhotoUri: 'file:///tablet/photos/soil-photo-1.jpg',
      }),
      createDocument('feature-1', 'Feature', {
        fieldworkPhotoUri: 'file:///tablet/photos/feature-1.jpg',
      }),
    ] as any)).toEqual([
      {
        category: 'Photo',
        resourceId: 'photo-1',
        uri: 'file:///tablet/photos/photo-1.jpg',
      },
      {
        category: 'Drawing',
        resourceId: 'drawing-1',
        uri: 'content://tablet/drawing-1.jpg',
      },
      {
        category: 'SoilProfilePhoto',
        resourceId: 'soil-photo-1',
        uri: 'file:///tablet/photos/soil-photo-1.jpg',
      },
    ]);
  });

  it('uses drawing-specific preservation values for uploaded drawings', () => {
    expect(getFieldworkImageUploadRecordUpdates(
      createDocument('drawing-1', 'Drawing', {
        digitalSourcePreservation: ['unpublishedDrawingRetained'],
      }) as any,
      'fieldwork',
      {
        category: 'Drawing',
        uri: 'content://tablet/drawing-1.jpg',
        uploadUrl: 'https://field.example/files/fieldwork/drawing-1?type=original_image',
      },
      '2026-06-23T01:02:03.000Z'
    )).toEqual(expect.objectContaining({
      digitalSourcePreservation: [
        'unpublishedDrawingRetained',
        'originalDrawing',
        'webOrServerBackup',
        'backupVerified',
      ],
    }));
  });

  it('uploads content URI drawings without requiring local file info preflight', async () => {
    renderHook(() => useFieldworkImageSync({
      documents: [
        createDocument('drawing-1', 'Drawing', {
          fileUri: 'content://tablet/drawing-1.jpg',
        }),
      ] as any,
      project: 'fieldwork',
      projectSettings,
      syncStatus: SyncStatus.InSync,
    }));

    await waitFor(() => {
      expect(FileSystem.uploadAsync).toHaveBeenCalledTimes(1);
    });

    expect(FileSystem.getInfoAsync).not.toHaveBeenCalled();
    expect(FileSystem.uploadAsync).toHaveBeenCalledWith(
      'https://field.example/files/fieldwork/drawing-1?type=original_image',
      'content://tablet/drawing-1.jpg',
      expect.objectContaining({
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      })
    );
  });

  it('reads MD5 upload metadata for file URI originals only', async () => {
    await expect(getFieldworkImageUploadMetadata({
      uri: 'file:///tablet/photos/photo-1.jpg',
    })).resolves.toEqual({
      uploadedMd5: 'tablet-md5',
      uploadedSizeBytes: 481516,
    });

    await expect(getFieldworkImageUploadMetadata({
      uri: 'content://tablet/drawing-1.jpg',
    })).resolves.toEqual({});
  });

  it('parses Field Hub stored metadata from upload responses', () => {
    expect(getFieldworkImageStoredMetadata(JSON.stringify({
      md5: 'stored-md5',
      sha256: 'stored-sha256',
      size_bytes: 481516,
    }))).toEqual({
      storedMd5: 'stored-md5',
      storedSha256: 'stored-sha256',
      storedSizeBytes: 481516,
    });
    expect(getFieldworkImageStoredMetadata('not json')).toEqual({});
  });
});

describe('Field Hub image upload URL helpers', () => {
  it('builds file upload URLs from base or db URLs', () => {
    expect(getFieldHubBaseUrl('https://field.example/db', 'fieldwork'))
      .toBe('https://field.example');
    expect(getFieldHubBaseUrl('https://field.example/db/fieldwork', 'fieldwork'))
      .toBe('https://field.example');
    expect(buildFieldworkImageUploadUrl(
      'https://field.example/',
      'field work',
      'photo 1'
    )).toBe(
      'https://field.example/files/field%20work/photo%201?type=original_image'
    );
  });
});

const createDocument = (
  id: string,
  category: string,
  resource: Record<string, unknown>
) => ({
  resource: {
    id,
    category,
    identifier: id,
    ...resource,
  },
});

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};
