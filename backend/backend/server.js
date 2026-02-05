const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const youtubedl = require('youtube-dl-exec');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Ensure downloads directory exists
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Get video information
app.post('/api/video-info', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Validate YouTube URL
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)/;
        if (!youtubeRegex.test(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        console.log('Getting video info for:', url);

        // Get video information using youtube-dl-exec
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: [
                'referer:youtube.com',
                'user-agent:googlebot'
            ]
        });

        const videoInfo = {
            title: info.title || 'Unknown Title',
            duration: info.duration || 0,
            uploader: info.uploader || 'Unknown Uploader',
            thumbnail: info.thumbnail || info.thumbnails?.[0]?.url || '',
            view_count: info.view_count || 0,
            upload_date: info.upload_date || ''
        };

        console.log('Video info retrieved successfully');
        res.json(videoInfo);

    } catch (error) {
        console.error('Error getting video info:', error);
        res.status(500).json({ 
            error: 'Failed to get video information. Please check the URL and try again.' 
        });
    }
});

// Download video/audio
app.post('/api/download', async (req, res) => {
    try {
        const { url, format } = req.body;
        
        if (!url || !format) {
            return res.status(400).json({ error: 'URL and format are required' });
        }

        if (!['mp3', 'mp4'].includes(format.toLowerCase())) {
            return res.status(400).json({ error: 'Format must be mp3 or mp4' });
        }

        console.log(`Starting ${format.toUpperCase()} download for:`, url);

        // Generate unique filename
        const timestamp = Date.now();
        const videoId = extractVideoId(url) || 'video';
        const outputPath = path.join(downloadsDir, `${videoId}_${timestamp}`);

        let downloadOptions = {
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            noPlaylist: true,
            maxDownloads: 1,
            retries: 2,
            fragmentRetries: 2,
            addHeader: [
                'referer:youtube.com',
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            ]
        };

        if (format.toLowerCase() === 'mp3') {
            // Audio download options - optimized for speed
            downloadOptions = {
                ...downloadOptions,
                extractAudio: true,
                audioFormat: 'mp3',
                audioQuality: 5, // Good quality but faster (0=best, 9=worst)
                format: 'bestaudio/best',
                output: `${outputPath}.%(ext)s`
            };
        } else {
            // Video download options - optimized for speed
            downloadOptions = {
                ...downloadOptions,
                format: 'best[height<=480]/best[height<=720]/best', // Start with 480p for speed
                mergeOutputFormat: 'mp4',
                output: `${outputPath}.%(ext)s`
            };
        }

        // Download the video/audio
        await youtubedl(url, downloadOptions);

        // Find the downloaded file
        const files = fs.readdirSync(downloadsDir);
        const downloadedFile = files.find(file => file.startsWith(`${videoId}_${timestamp}`));
        
        if (!downloadedFile) {
            throw new Error('Downloaded file not found');
        }

        const filePath = path.join(downloadsDir, downloadedFile);
        const stat = fs.statSync(filePath);

        // Set appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename="${downloadedFile}"`);
        res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'video/mp4');
        res.setHeader('Content-Length', stat.size);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Clean up file after sending (optional)
        fileStream.on('end', () => {
            setTimeout(() => {
                try {
                    fs.unlinkSync(filePath);
                    console.log('Temporary file cleaned up:', downloadedFile);
                } catch (cleanupError) {
                    console.error('Error cleaning up file:', cleanupError);
                }
            }, 5000); // Delete after 5 seconds
        });

        console.log(`${format.toUpperCase()} download completed:`, downloadedFile);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ 
            error: 'Download failed. Please try again with a different video or check your internet connection.' 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Utility function to extract video ID from YouTube URL
function extractVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`YouTube Converter Server running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    process.exit(0);
});

module.exports = app;
