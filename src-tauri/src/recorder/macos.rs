#[cfg(all(target_os = "macos", feature = "real-recording"))]
use super::{Error, Recorder};

#[cfg(all(target_os = "macos", feature = "real-recording"))]
use scap::capturer::{Capturer, Options, Resolution};
#[cfg(all(target_os = "macos", feature = "real-recording"))]
use std::sync::{Arc, Mutex};

#[cfg(all(target_os = "macos", feature = "real-recording"))]
pub struct MacOSRecorder {
    is_recording: bool,
    capturer: Option<Arc<Mutex<Capturer>>>,
    output_path: Option<String>,
}

#[cfg(all(target_os = "macos", feature = "real-recording"))]
impl MacOSRecorder {
    pub fn new() -> Self {
        Self {
            is_recording: false,
            capturer: None,
            output_path: None,
        }
    }

    fn initialize_capturer(&mut self, output_path: &str) -> Result<(), Error> {
        // Find all available capture targets (windows and displays)
        let targets = scap::get_all_targets();
        
        // Look for Slippi Dolphin window
        let dolphin_target = targets.iter().find(|target| {
            // Check if this is a Window target and matches our search
            if let scap::Target::Window(window) = target {
                window.title.contains("Slippi") || 
                window.title.contains("Dolphin") ||
                window.title.contains("Melee")
            } else {
                false
            }
        });

        // Use Dolphin window if found, otherwise fall back to main display
        let target = if let Some(target) = dolphin_target {
            if let scap::Target::Window(window) = target {
                log::info!("🎮 Found game window: {}", window.title);
            }
            target.clone()
        } else {
            log::warn!("⚠️  Dolphin window not found, using main display");
            scap::Target::Display(scap::get_main_display())
        };

        // Create capturer options
        let options = Options {
            fps: 30,
            target: Some(target),
            show_cursor: true,
            show_highlight: false,
            excluded_targets: None,
            output_type: scap::frame::FrameType::BGRAFrame,
            output_resolution: Resolution::_720p,
            crop_area: None,
            captures_audio: false,
            exclude_current_process_audio: false,
        };

        // Create the capturer
        let capturer = Capturer::build(options).map_err(|e| {
            Error::InitializationError(format!("Failed to build capturer: {}", e))
        })?;
        
        self.capturer = Some(Arc::new(Mutex::new(capturer)));
        self.output_path = Some(output_path.to_string());

        Ok(())
    }
}

#[cfg(all(target_os = "macos", feature = "real-recording"))]
impl Recorder for MacOSRecorder {
    fn start_recording(&mut self, output_path: &str) -> Result<(), Error> {
        if self.is_recording {
            return Err(Error::RecordingFailed("Already recording".to_string()));
        }

        log::info!("🎥 [MacOS] Starting recording to: {}", output_path);

        // Initialize the capturer
        self.initialize_capturer(output_path)?;

        // Start the capture
        if let Some(capturer) = &self.capturer {
            let mut capturer_lock = capturer.lock().map_err(|e| {
                Error::InitializationError(format!("Failed to lock capturer: {}", e))
            })?;

            capturer_lock.start_capture();
        } else {
            return Err(Error::InitializationError(
                "Capturer not initialized".to_string(),
            ));
        }

        self.is_recording = true;
        log::info!("✅ [MacOS] Recording started successfully");

        Ok(())
    }

    fn stop_recording(&mut self) -> Result<String, Error> {
        if !self.is_recording {
            return Err(Error::RecordingFailed("Not currently recording".to_string()));
        }

        log::info!("⏹️  [MacOS] Stopping recording...");

        // Stop the capture
        if let Some(capturer) = &self.capturer {
            let mut capturer_lock = capturer.lock().map_err(|e| {
                Error::RecordingFailed(format!("Failed to lock capturer: {}", e))
            })?;

            capturer_lock.stop_capture();
        }

        self.is_recording = false;

        let output_path = self
            .output_path
            .clone()
            .unwrap_or_else(|| "unknown.mp4".to_string());

        self.capturer = None;
        self.output_path = None;

        log::info!("✅ [MacOS] Recording stopped. Saved to: {}", output_path);

        Ok(output_path)
    }

    fn is_recording(&self) -> bool {
        self.is_recording
    }
}

#[cfg(all(target_os = "macos", feature = "real-recording"))]
impl Default for MacOSRecorder {
    fn default() -> Self {
        Self::new()
    }
}

