'use client';

import { registerFileResourceAction } from '@/app/espace/formateur/actions';
import { kindFromMime } from '@/lib/content/files';
import { FileUpload } from './FileUpload';

export function ResourceUpload({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  return (
    <FileUpload
      bucket="course-files"
      folder={`${courseId}/${lessonId}`}
      label="Fichier (PDF, audio, image, vidéo courte, document)"
      onUploaded={(f) =>
        registerFileResourceAction(lessonId, courseId, {
          title: f.name.replace(/\.[^.]+$/, '').slice(0, 160) || 'Fichier',
          kind: kindFromMime(f.mime),
          storage_path: f.path,
          size_bytes: f.size,
          downloadable: 'on',
        })
      }
    />
  );
}
