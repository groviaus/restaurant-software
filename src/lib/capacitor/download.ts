import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Downloads a file in both web and Capacitor environments
 * @param blob - The blob data to download
 * @param filename - The filename for the downloaded file
 * @param mimeType - Optional MIME type (e.g., 'text/csv', 'image/png', 'application/pdf')
 */
export async function downloadFile(
  blob: Blob,
  filename: string,
  mimeType?: string
): Promise<void> {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    // Use Capacitor Filesystem API for native apps
    try {
      // Convert blob to base64 using FileReader
      // This works for both text and binary files
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove data URL prefix (e.g., "data:image/png;base64,")
          const base64 = base64String.split(',')[1] || base64String;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Determine the file extension and directory
      const extension = filename.split('.').pop()?.toLowerCase() || '';
      const directory = getDirectoryForFileType(extension);

      // Write file to device storage
      // For binary files (images, PDFs), don't use encoding parameter
      // For text files (CSV), use UTF8 encoding
      const writeOptions: any = {
        path: filename,
        data: base64Data,
        directory,
      };
      
      // Only add encoding for text files
      if (mimeType?.startsWith('text/')) {
        writeOptions.encoding = Encoding.UTF8;
      }
      
      const filePath = await Filesystem.writeFile(writeOptions);

      // Try to share the file (opens native share dialog)
      // This allows users to save to Downloads, share via apps, etc.
      try {
        const fileUri = filePath.uri;
        await Share.share({
          title: 'Download File',
          text: `Download ${filename}`,
          url: fileUri,
          dialogTitle: 'Save or Share File',
        });
      } catch (shareError) {
        // If share fails, at least the file is saved
        // On some platforms, we might need to use a different approach
        console.warn('Share failed, file saved to:', filePath.uri);
      }
    } catch (error: any) {
      console.error('Failed to download file in native app:', error);
      throw new Error(`Failed to save file: ${error.message}`);
    }
  } else {
    // Use standard browser download for web
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

/**
 * Downloads a file from a URL
 * @param url - The URL to download from
 * @param filename - The filename for the downloaded file
 */
export async function downloadFileFromUrl(
  url: string,
  filename: string
): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || undefined;
    await downloadFile(blob, filename, contentType);
  } catch (error: any) {
    throw new Error(`Failed to download file: ${error.message}`);
  }
}

/**
 * Determines the appropriate directory for different file types
 * Note: Capacitor Filesystem uses Directory.Documents for all user-accessible files
 */
function getDirectoryForFileType(extension: string): Directory {
  // Use Documents directory for all file types
  // The Share API will allow users to save to Downloads or other locations
  return Directory.Documents;
}

