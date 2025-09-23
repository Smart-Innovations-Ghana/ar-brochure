class ARBrochureApp {
    constructor() {
        this.scene = null;
        this.arSystem = null;
        this.markers = [];
        this.isARStarted = false;
        this.trackingStatus = 'ready';
        this.activeMarkers = new Set();
        
        this.init();
    }

    init() {
        // Wait for DOM to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }

    setupApp() {
        this.setupUI();
        this.setupScene();
        this.setupMarkerTracking();
        this.setupVideoControls();
        this.setupGestureHandling();
    }

    setupUI() {
        const startButton = document.getElementById('start-ar');
        const instructionsOverlay = document.getElementById('instructions');
        const loadingScreen = document.getElementById('loading-screen');
        const toggleDebug = document.getElementById('toggle-debug');
        const resetTracking = document.getElementById('reset-tracking');

        // Start AR Experience
        startButton.addEventListener('click', () => {
            instructionsOverlay.classList.add('fade-out');
            setTimeout(() => {
                instructionsOverlay.classList.add('hidden');
                this.startARExperience();
            }, 500);
        });

        // Debug toggle
        toggleDebug.addEventListener('click', () => {
            this.toggleDebugMode();
        });

        // Reset tracking
        resetTracking.addEventListener('click', () => {
            this.resetTracking();
        });

        // Hide loading screen initially after 2 seconds
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => loadingScreen.classList.add('hidden'), 500);
        }, 2000);
    }

    setupScene() {
        this.scene = document.querySelector('#ar-scene');
        
        // Scene loaded event
        this.scene.addEventListener('loaded', () => {
            console.log('AR Scene loaded');
            this.arSystem = this.scene.systems['mindar-image-system'];
            this.setupARSystem();
        });
    }

    setupARSystem() {
        if (!this.arSystem) return;
        
        // Start AR system
        this.arSystem.start().then(() => {
            console.log('MindAR started successfully');
            this.isARStarted = true;
            this.updateTrackingStatus('ready');
        }).catch((error) => {
            console.error('Failed to start MindAR:', error);
            this.updateTrackingStatus('error');
        });
    }

    setupMarkerTracking() {
        // Get all marker entities
        for (let i = 0; i < 8; i++) {
            const marker = document.querySelector(`#marker-page${i + 1}`);
            if (marker) {
                this.markers.push({
                    element: marker,
                    index: i,
                    isTracked: false,
                    content: this.getMarkerContent(marker)
                });

                // Target found
                marker.addEventListener('targetFound', (event) => {
                    this.onMarkerFound(i);
                });

                // Target lost
                marker.addEventListener('targetLost', (event) => {
                    this.onMarkerLost(i);
                });
            }
        }
    }

    getMarkerContent(marker) {
        const video = marker.querySelector('a-plane[src*="video"]');
        const model = marker.querySelector('a-gltf-model');
        
        return {
            type: video ? 'video' : 'model',
            element: video || model,
            video: video ? document.querySelector(video.getAttribute('src')) : null
        };
    }

    onMarkerFound(markerIndex) {
        console.log(`Marker ${markerIndex + 1} found`);
        
        const marker = this.markers[markerIndex];
        marker.element.setAttribute('visible', true);
        marker.isTracked = true;
        this.activeMarkers.add(markerIndex);
        
        // Play detection sound
        const detectSound = document.querySelector('#detect-sound');
        if (detectSound) {
            detectSound.play().catch(e => console.log('Sound play failed:', e));
        }
        
        // Handle video content
        if (marker.content.type === 'video' && marker.content.video) {
            marker.content.video.play().catch(e => console.log('Video play failed:', e));
        }
        
        // Update UI
        this.updateTrackingStatus('active');
    }

    onMarkerLost(markerIndex) {
        console.log(`Marker ${markerIndex + 1} lost`);
        
        const marker = this.markers[markerIndex];
        marker.element.setAttribute('visible', false);
        marker.isTracked = false;
        this.activeMarkers.delete(markerIndex);
        
        // Pause video content
        if (marker.content.type === 'video' && marker.content.video) {
            marker.content.video.pause();
        }
        
        // Update UI
        this.updateTrackingStatus(this.activeMarkers.size > 0 ? 'active' : 'ready');
    }

    setupVideoControls() {
        // Handle play button clicks
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('play-button')) {
                const marker = event.target.closest('[mindar-image-target]');
                const video = marker.querySelector('a-plane[src*="video"]');
                
                if (video) {
                    const videoElement = document.querySelector(video.getAttribute('src'));
                    if (videoElement.paused) {
                        videoElement.play();
                    } else {
                        videoElement.pause();
                    }
                }
            }
        });
    }

    setupGestureHandling() {
        // Simplified gesture handling - removed complex custom components
        console.log('Gesture handling setup completed');
    }

    updateTrackingStatus(status) {
        const statusElement = document.getElementById('tracking-status');
        const statusTexts = {
            'ready': 'Ready',
            'active': `Tracking ${this.activeMarkers.size}`,
            'lost': 'Lost',
            'error': 'Error'
        };
        
        statusElement.textContent = statusTexts[status] || 'Unknown';
        statusElement.className = `tracking-${status}`;
        this.trackingStatus = status;
    }

    toggleDebugMode() {
        // This would toggle debug information display
        console.log('Debug mode toggled');
        // You can add debug UI here
    }

    resetTracking() {
        // Reset all tracking
        this.activeMarkers.clear();
        this.markers.forEach(marker => {
            marker.element.setAttribute('visible', false);
            marker.isTracked = false;
            if (marker.content.type === 'video' && marker.content.video) {
                marker.content.video.pause();
                marker.content.video.currentTime = 0;
            }
        });
        this.updateTrackingStatus('ready');
    }

    startARExperience() {
        // Additional setup when AR starts
        console.log('AR Experience Started');
    }
}

// Initialize the app
new ARBrochureApp();