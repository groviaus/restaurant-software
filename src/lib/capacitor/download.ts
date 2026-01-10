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

      // Use Cache directory - doesn't require storage permissions on Android
      // We'll share the file immediately, so it doesn't need to persist
      const writeOptions: any = {
        path: filename,
        data: base64Data,
        directory: Directory.Cache, // Cache directory doesn't require permissions
      };
      
      // Only add encoding for text files
      if (mimeType?.startsWith('text/')) {
        writeOptions.encoding = Encoding.UTF8;
      }
      
      const filePath = await Filesystem.writeFile(writeOptions);

      // Share the file (opens native share dialog)
      // This allows users to save to Downloads, share via apps, etc.
      try {
        const fileUri = filePath.uri;
        await Share.share({
          title: 'Download File',
          text: `Download ${filename}`,
          url: fileUri,
          dialogTitle: 'Save or Share File',
        });
        
        // Clean up the cached file after sharing (optional)
        // The file will be shared, so we can delete it from cache
        try {
          await Filesystem.deleteFile({
            path: filename,
            directory: Directory.Cache,
          });
        } catch (deleteError) {
          // Ignore delete errors - cache cleanup is optional
          console.warn('Failed to clean up cache file:', deleteError);
        }
      } catch (shareError: any) {
        // If share fails, try to clean up and throw error
        try {
          await Filesystem.deleteFile({
            path: filename,
            directory: Directory.Cache,
          });
        } catch (deleteError) {
          // Ignore delete errors
        }
        throw new Error(`Failed to share file: ${shareError.message || 'Unknown error'}`);
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


