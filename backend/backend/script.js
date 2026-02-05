class YouTubeConverter {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3001/api'; // Primary: ultra-fast server
        this.fallbackApiBaseUrl = 'http://localhost:3000/api'; // Fallback: standard server
        this.reliableApiBaseUrl = 'http://localhost:3002/api'; // Reliable: optimized server
        this.usingFallback = false;
        this.currentServer = 'ultra-fast';
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.urlInput = document.getElementById('youtubeUrl');
        this.getInfoBtn = document.getElementById('getInfoBtn');
        this.videoInfo = document.getElementById('videoInfo');
        this.videoThumbnail = document.getElementById('videoThumbnail');
        this.videoTitle = document.getElementById('videoTitle');
        this.videoDuration = document.getElementById('videoDuration');
        this.videoUploader = document.getElementById('videoUploader');
        this.downloadMp3Btn = document.getElementById('downloadMp3');
        this.downloadMp4Btn = document.getElementById('downloadMp4');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.downloadStatus = document.getElementById('downloadStatus');
        this.downloadComplete = document.getElementById('downloadComplete');
        this.downloadLink = document.getElementById('downloadLink');
        this.errorModal = document.getElementById('errorModal');
        this.errorMessage = document.getElementById('errorMessage');
        this.closeModal = document.querySelector('.close');
    }

    bindEvents() {
        this.getInfoBtn.addEventListener('click', () => this.getVideoInfo());
        this.downloadMp3Btn.addEventListener('click', () => this.downloadVideo('mp3'));
        this.downloadMp4Btn.addEventListener('click', () => this.downloadVideo('mp4'));
        this.closeModal.addEventListener('click', () => this.hideError());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.getVideoInfo();
            }
        });

        // Close modal when clicking outside
        this.errorModal.addEventListener('click', (e) => {
            if (e.target === this.errorModal) {
                this.hideError();
            }
        });
    }

    validateYouTubeUrl(url) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)/;
        return youtubeRegex.test(url);
    }

    extractVideoId(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorModal.classList.remove('hidden');
    }

    hideError() {
        this.errorModal.classList.add('hidden');
    }

    setLoading(element, isLoading) {
        if (isLoading) {
            element.disabled = true;
            element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        } else {
            element.disabled = false;
            element.innerHTML = element.id === 'getInfoBtn' 
                ? '<i class="fas fa-search"></i> Get Info'
                : element.id === 'downloadMp3' 
                    ? '<i class="fas fa-music"></i> Download MP3'
                    : '<i class="fas fa-video"></i> Download MP4';
        }
    }

    async getVideoInfo() {
        const url = this.urlInput.value.trim();
        
        if (!url) {
            this.showError('Please enter a YouTube URL');
            return;
        }

        if (!this.validateYouTubeUrl(url)) {
            this.showError('Please enter a valid YouTube URL');
            return;
        }

        this.setLoading(this.getInfoBtn, true);
        this.hideVideoInfo();

        try {
            const response = await this.makeRequest('/video-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get video information');
            }

            this.displayVideoInfo(data);
        } catch (error) {
            console.error('Error:', error);
            this.showError(error.message || 'Failed to get video information. Please try again.');
        } finally {
            this.setLoading(this.getInfoBtn, false);
        }
    }

    async makeRequest(endpoint, options) {
        // Try ultra-fast server first
        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, options);
            if (response.ok || response.status !== 404) {
                this.currentServer = 'ultra-fast';
                return response;
            }
            throw new Error('Ultra-fast server not available');
        } catch (error) {
            console.log('Ultra-fast server failed, trying reliable server...');
            
            // Try reliable server
            try {
                const response = await fetch(`${this.reliableApiBaseUrl}${endpoint}`, options);
                if (response.ok || response.status !== 404) {
                    this.currentServer = 'reliable';
                    return response;
                }
                throw new Error('Reliable server not available');
            } catch (error2) {
                console.log('Reliable server failed, trying standard server...');
                
                // Final fallback to standard server
                this.currentServer = 'standard';
                return fetch(`${this.fallbackApiBaseUrl}${endpoint}`, options);
            }
        }
    }

    displayVideoInfo(videoData) {
        this.videoThumbnail.src = videoData.thumbnail;
        this.videoTitle.textContent = videoData.title;
        this.videoDuration.textContent = `Duration: ${this.formatDuration(videoData.duration)}`;
        this.videoUploader.textContent = `Uploader: ${videoData.uploader}`;
        
        this.videoInfo.classList.remove('hidden');
    }

    hideVideoInfo() {
        this.videoInfo.classList.add('hidden');
        this.progressSection.classList.add('hidden');
        this.downloadComplete.classList.add('hidden');
    }

    formatDuration(seconds) {
        if (!seconds) return 'N/A';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    }

    async downloadVideo(format) {
        const url = this.urlInput.value.trim();
        
        if (!url) {
            this.showError('Please enter a YouTube URL');
            return;
        }

        const downloadBtn = format === 'mp3' ? this.downloadMp3Btn : this.downloadMp4Btn;
        this.setLoading(downloadBtn, true);
        
        this.progressSection.classList.remove('hidden');
        this.downloadComplete.classList.add('hidden');
        
        this.updateProgress(0, 'Preparing download...');

        try {
            const response = await this.makeRequest('/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    url: url, 
                    format: format 
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Download failed');
            }

            // Show which server is being used
            const serverNames = {
                'ultra-fast': 'Ultra-Fast',
                'reliable': 'Reliable',
                'standard': 'Standard'
            };
            const serverType = serverNames[this.currentServer] || 'Unknown';
            this.updateProgress(50, `Using ${serverType} server...`);

            // Simulate download progress (since we can't get real progress from the server easily)
            await this.simulateProgress();

            // Get the blob from response
            const blob = await response.blob();
            
            // Create download link
            const downloadUrl = window.URL.createObjectURL(blob);
            const videoId = this.extractVideoId(url);
            const filename = `youtube_${videoId}.${format}`;
            
            this.downloadLink.href = downloadUrl;
            this.downloadLink.download = filename;
            
            this.progressSection.classList.add('hidden');
            this.downloadComplete.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error:', error);
            this.showError(error.message || 'Download failed. Please try again.');
            this.progressSection.classList.add('hidden');
        } finally {
            this.setLoading(downloadBtn, false);
        }
    }

    async simulateProgress() {
        const steps = [
            { progress: 30, message: 'Analyzing video...' },
            { progress: 60, message: 'Processing with yt-dlp...' },
            { progress: 85, message: 'Finalizing download...' },
            { progress: 100, message: 'Download ready!' }
        ];

        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, 400)); // Faster progress updates
            this.updateProgress(step.progress, step.message);
        }
    }

    updateProgress(percentage, message) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `${percentage}%`;
        this.downloadStatus.textContent = message;
    }
}

// Utility functions
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new YouTubeConverter();
});

// Add some animations and interactions
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling for better UX
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add entrance animations
    const elements = document.querySelectorAll('.converter-section, .features-section');
    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            el.style.transition = 'all 0.6s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 200);
    });
    
    // Add ripple effect to buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add CSS for ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});
