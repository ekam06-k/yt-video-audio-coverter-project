# YouTube Converter Project  
## Note for Sir  

Respected Sir,  

The frontend design and interface of my YouTube Converter project are working properly.  
However, when I paste any YouTube video or song link, the system shows the error:  

**“Invalid URL or Check Internet Connection.”**

Because of this issue, the main functionality of downloading/converting is not working.  
I tried multiple times to resolve it, but the error still persists.  

Since the project will be checked on **Tuesday**, I wanted to inform you in advance.  
I kindly request you to consider the design, layout, and user interface part of my work for evaluation.  

Thank you for your kind understanding.  

**– Pooja**  
B.Tech CSE, 4th Semester, Section B  











# YouTube to MP3/MP4 Converter

A web-based YouTube video converter that allows users to download YouTube videos as MP3 (audio) or MP4 (video) files.

## Features

- 🎵 Convert YouTube videos to high-quality MP3 audio files
- 🎥 Download YouTube videos in MP4 format (up to 720p)
- 🚀 Fast processing and download
- 📱 Responsive design that works on all devices
- 🛡️ Safe and secure - no data stored on server
- 🎨 Modern and intuitive user interface
- ⚡ Real-time progress tracking

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Video Processing**: youtube-dl-exec
- **Styling**: Custom CSS with Font Awesome icons

## Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd youtube-mp3-converter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

1. **Paste YouTube URL**: Enter a valid YouTube video URL in the input field
2. **Get Video Info**: Click "Get Info" to fetch video details and thumbnail
3. **Choose Format**: Select either MP3 (audio) or MP4 (video) download
4. **Download**: Click the download button and wait for processing
5. **Save File**: Once complete, click the download link to save the file

## API Endpoints

### GET /
- **Description**: Serves the main HTML page
- **Response**: HTML page

### POST /api/video-info
- **Description**: Get video information from YouTube URL
- **Body**: `{ "url": "youtube_video_url" }`
- **Response**: Video metadata including title, duration, uploader, thumbnail

### POST /api/download
- **Description**: Download video in specified format
- **Body**: `{ "url": "youtube_video_url", "format": "mp3|mp4" }`
- **Response**: File stream for download

### GET /api/health
- **Description**: Health check endpoint
- **Response**: `{ "status": "OK", "timestamp": "..." }`

## Project Structure

```
youtube-mp3-converter/
├── index.html          # Main HTML page
├── styles.css          # CSS styling
├── script.js           # Frontend JavaScript
├── server.js           # Backend server
├── package.json        # Node.js dependencies
├── downloads/          # Temporary download directory
└── README.md           # This file
```

## Dependencies

### Backend
- **express**: Web framework for Node.js
- **cors**: Cross-Origin Resource Sharing middleware
- **youtube-dl-exec**: YouTube video downloader
- **path**: File path utilities
- **fs**: File system operations

### Frontend
- **Font Awesome**: Icon library
- **Modern JavaScript**: ES6+ features

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Security & Privacy

- No user data is stored on the server
- Downloaded files are automatically cleaned up after transfer
- HTTPS recommended for production deployment
- CORS enabled for cross-origin requests

## Limitations

- Video quality limited to 720p for faster processing
- File size limits depend on server configuration
- Temporary files are stored during processing

## Troubleshooting

### Common Issues

1. **"Invalid YouTube URL" error**
   - Ensure the URL is a valid YouTube video link
   - Supported formats: youtube.com/watch?v=, youtu.be/, youtube.com/embed/

2. **Download fails**
   - Check internet connection
   - Try a different video
   - Restart the server

3. **Server won't start**
   - Ensure Node.js is installed
   - Run `npm install` to install dependencies
   - Check if port 3000 is available

### Error Logs

Server logs are displayed in the console. Common error types:
- Network errors (connection issues)
- Video processing errors (corrupted/unavailable videos)
- File system errors (permissions, disk space)

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon for automatic server restarts on file changes.

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

### Adding New Features

1. **Frontend changes**: Modify `index.html`, `styles.css`, or `script.js`
2. **Backend changes**: Modify `server.js`
3. **New dependencies**: Add to `package.json` and run `npm install`

## Deployment

### Local Deployment
1. Install dependencies: `npm install`
2. Start server: `npm start`
3. Access at `http://localhost:3000`

### Production Deployment
1. Set `NODE_ENV=production`
2. Use a process manager like PM2
3. Configure reverse proxy (nginx/Apache)
4. Enable HTTPS
5. Set up proper logging

## Legal Notice

This tool is for educational purposes only. Users are responsible for complying with YouTube's Terms of Service and applicable copyright laws. The developers are not responsible for any misuse of this software.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review server logs for errors
3. Ensure all dependencies are installed
4. Test with different YouTube URLs

---

**Note**: This application requires an active internet connection and depends on external services for video processing.
