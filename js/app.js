class ARBrochureApp {
    constructor() {
        this.scene = null;
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
            this.isARStarted = true;
        });

        // Handle render error
        this.scene.addEventListener('render-error', (event) => {
            console.error('Render error:', event.detail);
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
                marker.addEventListener('targetFound', () => {
                    this.onMarkerFound(i);
                });

                // Target lost
                marker.addEventListener('targetLost', () => {
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
        this.animateMarkerIn(marker.element);
    }

    onMarkerLost(markerIndex) {
        console.log(`Marker ${markerIndex + 1} lost`);
        
        const marker = this.markers[markerIndex];
        marker.isTracked = false;
        this.activeMarkers.delete(markerIndex);
        
        // Pause video content
        if (marker.content.type === 'video' && marker.content.video) {
            marker.content.video.pause();
        }
        
        // Update UI
        this.updateTrackingStatus(this.activeMarkers.size > 0 ? 'active' : 'ready');
        this.animateMarkerOut(marker.element);
    }

    animateMarkerIn(markerElement) {
        // Trigger entrance animation
        const animationIn = markerElement.querySelector('[animation__in]');
        if (animationIn) {
            animationIn.emit('animationcomplete');
        }
    }

    animateMarkerOut(markerElement) {
        // Trigger exit animation
        const animationOut = markerElement.querySelector('[animation__out]');
        if (animationOut) {
            animationOut.emit('animationcomplete');
        }
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
        // Register gesture component for 3D model interaction
        AFRAME.registerComponent('gesture-handler', {
            schema: {
                enabled: {default: true}
            },

            init: function () {
                this.handleScale = this.handleScale.bind(this);
                this.handleRotation = this.handleRotation.bind(this);
                
                this.isVisible = false;
                this.initialScale = this.el.getAttribute('scale');
                
                this.el.sceneEl.addEventListener('markerFound', (e) => {
                    if (e.target === this.el) {
                        this.isVisible = true;
                    }
                });
                
                this.el.sceneEl.addEventListener('markerLost', (e) => {
                    if (e.target === this.el) {
                        this.isVisible = false;
                    }
                });
            },

            handleRotation: function(event) {
                if (this.isVisible) {
                    this.el.object3D.rotation.y += event.detail.rotationDelta;
                }
            },

            handleScale: function(event) {
                if (this.isVisible) {
                    let scaleFactor = 1 + event.detail.spreadDelta / 400;
                    
                    scaleFactor = Math.min(Math.max(scaleFactor, 0.3), 3);
                    
                    this.el.setAttribute('scale', {
                        x: this.initialScale.x * scaleFactor,
                        y: this.initialScale.y * scaleFactor,
                        z: this.initialScale.z * scaleFactor
                    });
                }
            }
        });
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
        
        // Request camera permissions explicitly for mobile
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    console.log('Camera access granted');
                    stream.getTracks().forEach(track => track.stop());
                })
                .catch(err => {
                    console.error('Camera access denied:', err);
                    alert('Camera access is required for the AR experience');
                });
        }
    }
}

// Initialize the app
new ARBrochureApp();

// Additional AFRAME components for enhanced functionality
AFRAME.registerComponent('gesture-detector', {
    init: function () {
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        
        this.el.addEventListener('touchstart', this.handleTouchStart);
        this.el.addEventListener('touchmove', this.handleTouchMove);
        this.el.addEventListener('touchend', this.handleTouchEnd);
        
        this.touches = [];
    },

    handleTouchStart: function (event) {
        this.touches = Array.from(event.touches);
    },

    handleTouchMove: function (event) {
        const touches = Array.from(event.touches);
        
        if (touches.length === 2 && this.touches.length === 2) {
            const touch1 = touches[0];
            const touch2 = touches[1];
            const prevTouch1 = this.touches[0];
            const prevTouch2 = this.touches[1];
            
            // Calculate spread delta for pinch-to-zoom
            const currentSpread = Math.sqrt(
                Math.pow(touch1.clientX - touch2.clientX, 2) +
                Math.pow(touch1.clientY - touch2.clientY, 2)
            );
            
            const prevSpread = Math.sqrt(
                Math.pow(prevTouch1.clientX - prevTouch2.clientX, 2) +
                Math.pow(prevTouch1.clientY - prevTouch2.clientY, 2)
            );
            
            const spreadDelta = currentSpread - prevSpread;
            
            this.el.emit('gesturechange', {
                spreadDelta: spreadDelta,
                touches: touches
            });
        }
        
        if (touches.length === 1 && this.touches.length === 1) {
            const touch = touches[0];
            const prevTouch = this.touches[0];
            
            const rotationDelta = (touch.clientX - prevTouch.clientX) / 100;
            
            this.el.emit('gesturerotate', {
                rotationDelta: rotationDelta
            });
        }
        
        this.touches = touches;
    },

    handleTouchEnd: function (event) {
        this.touches = Array.from(event.touches);
    }
});