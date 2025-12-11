import { get, list } from '@vercel/blob';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    let filename;
    
    if (req.method === 'POST') {
      ({ filename } = req.body);
    } else {
      filename = req.query.filename;
    }

    if (!filename) {
      res.status(400).json({ success: false, error: 'Filename is required' });
      return;
    }

    // Sanitize filename
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const blobPath = `feat-spec/${safeFilename}`;

    // List blobs to find the exact match
    const { blobs } = await list({ prefix: blobPath });
    
    // Find exact match (not just prefix match)
    const blob = blobs.find(b => b.pathname === blobPath);
    
    if (!blob) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }

    // Get the blob content
    const fileBlob = await get(blob.url);
    const content = await fileBlob.text();

    res.status(200).json({
      success: true,
      filename: safeFilename,
      content: content,
      size: blob.size,
      modified: blob.uploadedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error loading file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

