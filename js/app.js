class ARBrochureApp {
  constructor() {
    this.scene = null;
    this.markers = [];
    this.isARStarted = false;
    this.trackingStatus = "ready";
    this.activeMarkers = new Set();
    this.hasUserInteracted = false;
    this.videos = [];

    this.init();
  }

  init() {
    // Wait for DOM to load
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setupApp());
    } else {
      this.setupApp();
    }
  }

    setupApp() {
        this.setupUI();
        this.setupScene();
        
        // Start camera immediately, don't wait for assets
        this.startCamera();
        
        this.setupMarkerTracking();
        this.setupVideoControls();
        this.setupUserInteraction();
    }

    startCamera() {
        // Force camera start regardless of asset loading
        const arSystem = document.querySelector('a-scene').systems['arjs'];
        if (arSystem) {
            arSystem._initialize();
        }
        console.log('Attempting to start camera...');
    }  setupUI() {
    const startButton = document.getElementById("start-ar");
    const instructionsOverlay = document.getElementById("instructions");
    const loadingScreen = document.getElementById("loading-screen");
    const toggleDebug = document.getElementById("toggle-debug");
    const resetTracking = document.getElementById("reset-tracking");

    // Start AR Experience
    startButton.addEventListener("click", () => {
      instructionsOverlay.classList.add("fade-out");
      setTimeout(() => {
        instructionsOverlay.classList.add("hidden");
        this.startARExperience();
      }, 500);
    });

    // Debug toggle
    toggleDebug.addEventListener("click", () => {
      this.toggleDebugMode();
    });

    // Reset tracking
    resetTracking.addEventListener("click", () => {
      this.resetTracking();
    });

    // Hide loading screen after scene loads
    setTimeout(() => {
      loadingScreen.classList.add("fade-out");
      setTimeout(() => loadingScreen.classList.add("hidden"), 500);
    }, 2000);
  }

  setupScene() {
    this.scene = document.querySelector("#ar-scene");

    // Scene loaded event
    this.scene.addEventListener("loaded", () => {
      console.log("AR Scene loaded");
      this.isARStarted = true;
      this.updateTrackingStatus("ready");
    });

    // Handle asset loading errors
    const assetSystem = this.scene.getAttribute("asset-loading-timeout");
    if (!assetSystem) {
      this.scene.setAttribute("asset-loading-timeout", 10000); // Increase timeout to 10 seconds
    }

    // AR.js ready event
    this.scene.addEventListener("arjs-video-loaded", () => {
      console.log("AR.js video loaded");
    });

    // Handle asset loading errors
    this.scene.addEventListener("model-error", (e) => {
      console.warn("Model loading error:", e.detail.src);
    });

    this.scene.addEventListener("video-error", (e) => {
      console.warn("Video loading error:", e.detail.src);
    });
  }

  setupMarkerTracking() {
    // Get all marker entities
    const markerSelectors = [
      "#marker-page1",
      "#marker-page2",
      "#marker-page3",
      "#marker-page4",
      "#marker-page5",
      "#marker-page6",
      "#marker-page7",
      "#marker-page8",
    ];

    markerSelectors.forEach((selector, index) => {
      const marker = document.querySelector(selector);
      if (marker) {
        this.markers.push({
          element: marker,
          index: index,
          isTracked: false,
          content: this.getMarkerContent(marker),
        });

        // Marker found
        marker.addEventListener("markerFound", () => {
          this.onMarkerFound(index);
        });

        // Marker lost
        marker.addEventListener("markerLost", () => {
          this.onMarkerLost(index);
        });
      }
    });
  }

  getMarkerContent(marker) {
    const videoPlane = marker.querySelector('a-plane[src*="video"]');
    const model = marker.querySelector("a-gltf-model");

    let videoElement = null;
    if (videoPlane) {
      const videoSrc = videoPlane.getAttribute("src");
      videoElement = document.querySelector(videoSrc);
    }

    return {
      type: videoPlane ? "video" : "model",
      element: videoPlane || model,
      video: videoElement,
    };
  }

  onMarkerFound(markerIndex) {
    console.log(`Marker ${markerIndex + 1} found`);

    const marker = this.markers[markerIndex];
    if (!marker) return;

    marker.isTracked = true;
    this.activeMarkers.add(markerIndex);

    // Play detection sound
    const detectSound = document.querySelector("#detect-sound");
    if (detectSound && this.hasUserInteracted) {
      detectSound.play().catch((e) => console.log("Sound play failed:", e));
    }

    // Handle video content
    if (
      marker.content.type === "video" &&
      marker.content.video &&
      this.hasUserInteracted
    ) {
      marker.content.video
        .play()
        .catch((e) => console.log("Video play failed:", e));
    }

    // Update UI
    this.updateTrackingStatus("active");
  }

  onMarkerLost(markerIndex) {
    console.log(`Marker ${markerIndex + 1} lost`);

    const marker = this.markers[markerIndex];
    if (!marker) return;

    marker.isTracked = false;
    this.activeMarkers.delete(markerIndex);

    // Pause video content
    if (marker.content.type === "video" && marker.content.video) {
      marker.content.video.pause();
    }

    // Update UI
    this.updateTrackingStatus(this.activeMarkers.size > 0 ? "active" : "ready");
  }

  setupVideoControls() {
    // Collect all video elements
    this.videos = [
      document.querySelector("#video-page1"),
      document.querySelector("#video-page3"),
      document.querySelector("#video-page5"),
      document.querySelector("#video-page7"),
    ].filter((video) => video !== null);

    // Handle play button clicks on markers
    document.addEventListener("click", (event) => {
      if (
        event.target.classList.contains("play-button") ||
        event.target.closest(".play-button")
      ) {
        const marker = event.target.closest("a-marker");
        if (marker) {
          const markerIndex = this.markers.findIndex(
            (m) => m.element === marker
          );
          if (markerIndex !== -1) {
            const markerData = this.markers[markerIndex];
            if (
              markerData.content.type === "video" &&
              markerData.content.video
            ) {
              if (markerData.content.video.paused) {
                markerData.content.video.play();
              } else {
                markerData.content.video.pause();
              }
            }
          }
        }
      }
    });
  }

  setupUserInteraction() {
    const playButton = document.querySelector("#playButton");

    const enableInteraction = () => {
      if (!this.hasUserInteracted) {
        this.hasUserInteracted = true;

        // Enable all videos
        this.videos.forEach((video) => {
          if (video) {
            video.muted = false;
            // Try to play videos that are on active markers
            const activeMarker = this.markers.find(
              (m) => m.isTracked && m.content.video === video
            );
            if (activeMarker) {
              video.play().catch((e) => console.log("Video play failed:", e));
            }
          }
        });

        playButton.style.display = "none";
        console.log("User interaction enabled");
      }
    };

    // Handle various interaction events
    playButton.addEventListener("click", enableInteraction);
    playButton.addEventListener("touchend", (e) => {
      e.preventDefault();
      enableInteraction();
    });

    // Also enable on any document interaction
    document.addEventListener("click", enableInteraction, { once: true });
    document.addEventListener("touchend", enableInteraction, { once: true });
  }

  updateTrackingStatus(status) {
    const statusElement = document.getElementById("tracking-status");
    const statusTexts = {
      ready: "Ready",
      active: `Tracking ${this.activeMarkers.size}`,
      lost: "Lost",
      error: "Error",
    };

    statusElement.textContent = statusTexts[status] || "Unknown";
    statusElement.className = `tracking-${status}`;
    this.trackingStatus = status;
  }

  toggleDebugMode() {
    // Toggle AR.js debug UI
    const arjsSystem = this.scene.systems.arjs;
    if (arjsSystem) {
      const currentDebug = this.scene.getAttribute("arjs").debugUIEnabled;
      this.scene.setAttribute("arjs", "debugUIEnabled", !currentDebug);
      console.log("Debug mode:", !currentDebug ? "enabled" : "disabled");
    }
  }

  resetTracking() {
    // Reset all tracking
    this.activeMarkers.clear();
    this.markers.forEach((marker) => {
      marker.isTracked = false;
      if (marker.content.type === "video" && marker.content.video) {
        marker.content.video.pause();
        marker.content.video.currentTime = 0;
      }
    });
    this.updateTrackingStatus("ready");
    console.log("Tracking reset");
  }

  startARExperience() {
    console.log("AR Experience Started");
    // Additional setup when AR starts
    this.updateTrackingStatus("ready");
  }
}

// Initialize the app
new ARBrochureApp();
