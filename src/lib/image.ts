import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compresses an image to a max dimension while preserving aspect ratio.
 * Returns a base64 string (without the `data:image/...;base64,` prefix).
 * The backend strips that prefix anyway, but staying lean cuts payload size.
 */
export async function compressForUpload(
  uri: string,
  options: { maxWidth?: number; quality?: number } = {},
): Promise<string> {
  const { maxWidth = 720, quality = 0.7 } = options;
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxWidth } }],
    {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );
  if (!result.base64) throw new Error('Compression failed: no base64 output');
  return result.base64;
}
