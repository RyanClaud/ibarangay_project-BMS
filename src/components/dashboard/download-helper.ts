/**
 * Triggers a file download in the browser.
 * Works on both desktop and mobile.
 *
 * @param blob The file content as a Blob.
 * @param fileName The desired name for the downloaded file.
 */
export const triggerBrowserDownload = (blob: Blob, fileName: string) => {
  // Create a URL for the blob
  const url = window.URL.createObjectURL(blob);

  // Create a temporary anchor element
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = fileName;

  // Append to the DOM, trigger the click, and remove it
  document.body.appendChild(a);
  a.click();

  // Clean up by revoking the object URL
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};