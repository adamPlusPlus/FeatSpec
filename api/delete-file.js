import { del, list } from '@vercel/blob';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { filename } = req.body;

    if (!filename) {
      res.status(400).json({ success: false, error: 'Filename is required' });
      return;
    }

    // Sanitize filename
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const blobPath = `feat-spec/${safeFilename}`;

    // Find the blob URL first
    const { blobs } = await list({ prefix: blobPath });
    
    // Find exact match
    const blob = blobs.find(b => b.pathname === blobPath);
    
    if (!blob) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }

    // Delete the blob
    await del(blob.url);

    res.status(200).json({
      success: true,
      filename: safeFilename,
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

