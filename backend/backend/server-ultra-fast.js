const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const YTDlpWrap = require('yt-dlp-wrap').default;

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize yt-dlp wrapper
const ytDlpWrap = new YTDlpWrap();

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

// Get video information - SIMPLE & FAST
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

        // Use yt-dlp-wrap for getting video info
        const info = await ytDlpWrap.getVideoInfo(url);

        const videoInfo = {
            title: info.title || 'Unknown Title',
            duration: info.duration || 0,
            uploader: info.uploader || info.channel || 'Unknown Uploader',
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

// Download video/audio - ULTRA FAST VERSION
app.post('/api/download', async (req, res) => {
    try {
        const { url, format } = req.body;
        
        if (!url || !format) {
            return res.status(400).json({ error: 'URL and format are required' });
        }

        if (!['mp3', 'mp4'].includes(format.toLowerCase())) {
            return res.status(400).json({ error: 'Format must be mp3 or mp4' });
        }

        console.log(`Starting FAST ${format.toUpperCase()} download for:`, url);

        // Generate unique filename
        const timestamp = Date.now();
        const videoId = extractVideoId(url) || 'video';
        const outputPath = path.join(downloadsDir, `${videoId}_${timestamp}`);

        // Download with optimized settings using yt-dlp-wrap
        const filePath = await downloadVideoFast(url, format, outputPath);
        
        if (!fs.existsSync(filePath)) {
            throw new Error('Downloaded file not found');
        }

        const stat = fs.statSync(filePath);
        const filename = path.basename(filePath);

        // Set appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'video/mp4');
        res.setHeader('Content-Length', stat.size);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Clean up file after sending
        fileStream.on('end', () => {
            setTimeout(() => {
                try {
                    fs.unlinkSync(filePath);
                    console.log('Temporary file cleaned up:', filename);
                } catch (cleanupError) {
                    console.error('Error cleaning up file:', cleanupError);
                }
            }, 1000);
        });

        console.log(`${format.toUpperCase()} download completed:`, filename);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ 
            error: 'Download failed. Please try again.' 
        });
    }
});

// Fast download function using yt-dlp-wrap
function downloadVideoFast(url, format, outputPath) {
    return new Promise(async (resolve, reject) => {
        try {
            let options = [];
            
            if (format.toLowerCase() === 'mp3') {
                // ULTRA FAST MP3 settings
                options = [
                    '--extract-audio',
                    '--audio-format', 'mp3',
                    '--audio-quality', '5', // Fast conversion
                    '--format', 'bestaudio[ext=m4a]/bestaudio',
                    '--no-playlist',
                    '--no-warnings',
                    '--output', `${outputPath}.%(ext)s`
                ];
            } else {
                // ULTRA FAST MP4 settings
                options = [
                    '--format', 'best[height<=360]/best[height<=480]/best', // Lower quality for speed
                    '--merge-output-format', 'mp4',
                    '--no-playlist',
                    '--no-warnings',
                    '--output', `${outputPath}.%(ext)s`
                ];
            }

            // Execute download with yt-dlp-wrap
            await ytDlpWrap.execPromise([url, ...options]);

            // Find the downloaded file
            const files = fs.readdirSync(downloadsDir);
            const baseFilename = path.basename(outputPath);
            const downloadedFile = files.find(file => file.startsWith(baseFilename));
            
            if (downloadedFile) {
                resolve(path.join(downloadsDir, downloadedFile));
            } else {
                reject(new Error('Downloaded file not found'));
            }
        } catch (error) {
            reject(new Error(`Download failed: ${error.message}`));
        }
    });
}

// Utility function to extract video ID from YouTube URL
function extractVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

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
    console.log(`🚀 ULTRA FAST YouTube Converter running on http://localhost:${PORT}`);
    console.log('⚡ Optimized for maximum speed');
    console.log('📋 Make sure yt-dlp is installed globally: pip install yt-dlp');
    console.log('Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    process.exit(0);
});

module.exports = app;
