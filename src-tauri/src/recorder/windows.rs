#[cfg(all(target_os = "windows", feature = "real-recording"))]
use super::{Error, Recorder};

#[cfg(all(target_os = "windows", feature = "real-recording"))]
use windows_record::{Recorder as WinRecorder, RecorderConfig};

#[cfg(all(target_os = "windows", feature = "real-recording"))]
pub struct WindowsRecorder {
    is_recording: bool,
    recorder: Option<WinRecorder>,
    output_path: Option<String>,
}

#[cfg(all(target_os = "windows", feature = "real-recording"))]
impl WindowsRecorder {
    pub fn new() -> Self {
        Self {
            is_recording: false,
            recorder: None,
            output_path: None,
        }
    }

    fn initialize_recorder(&mut self, output_path: &str) -> Result<(), Error> {
        // Create recorder config with windows-record builder
        let config = WinRecorder::builder()
            .fps(30, 1)
            .output_dimensions(1920, 1080)
            .capture_audio(true)
            .output_path(output_path)
            .build();

        // Create the recorder and target Slippi Dolphin window
        // windows-record will search for windows containing "Slippi Dolphin"
        let recorder = WinRecorder::new(config)
            .map_err(|e| Error::InitializationError(format!("Failed to create recorder: {}", e)))?
            .with_process_name("Slippi Dolphin");

        self.recorder = Some(recorder);
        self.output_path = Some(output_path.to_string());

        Ok(())
    }
}

#[cfg(all(target_os = "windows", feature = "real-recording"))]
impl Recorder for WindowsRecorder {
    fn start_recording(&mut self, output_path: &str) -> Result<(), Error> {
        if self.is_recording {
            return Err(Error::RecordingFailed("Already recording".to_string()));
        }

        log::info!("🎥 [Windows] Starting recording to: {}", output_path);

        // Initialize the recorder targeting Slippi Dolphin window
        self.initialize_recorder(output_path)?;

        // Start the recording
        if let Some(ref recorder) = self.recorder {
            recorder.start_recording().map_err(|e| {
                Error::RecordingFailed(format!("Failed to start recording: {}", e))
            })?;
        } else {
            return Err(Error::InitializationError(
                "Recorder not initialized".to_string(),
            ));
        }

        self.is_recording = true;
        log::info!("✅ [Windows] Recording started successfully");

        Ok(())
    }

    fn stop_recording(&mut self) -> Result<String, Error> {
        if !self.is_recording {
            return Err(Error::RecordingFailed("Not currently recording".to_string()));
        }

        log::info!("⏹️  [Windows] Stopping recording...");

        // Stop the recording
        if let Some(ref recorder) = self.recorder {
            recorder.stop_recording().map_err(|e| {
                Error::RecordingFailed(format!("Failed to stop recording: {}", e))
            })?;
        }

        self.is_recording = false;

        let output_path = self
            .output_path
            .clone()
            .unwrap_or_else(|| "unknown.mp4".to_string());

        self.recorder = None;
        self.output_path = None;

        log::info!("✅ [Windows] Recording stopped. Saved to: {}", output_path);

        Ok(output_path)
    }

    fn is_recording(&self) -> bool {
        self.is_recording
    }
}

#[cfg(all(target_os = "windows", feature = "real-recording"))]
impl Default for WindowsRecorder {
    fn default() -> Self {
        Self::new()
    }
}

