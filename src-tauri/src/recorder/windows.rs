#![cfg_attr(
    all(target_os = "windows", feature = "real-recording"),
    allow(unexpected_cfgs)
)]

#[cfg(all(target_os = "windows", feature = "real-recording"))]
use super::{Error, Recorder};

#[cfg(all(target_os = "windows", feature = "real-recording"))]
use std::sync::{Arc, Mutex};

#[cfg(all(target_os = "windows", feature = "real-recording"))]
use windows_record::Recorder as WinRecorder;

#[cfg(all(target_os = "windows", feature = "real-recording"))]
const DEFAULT_FPS: u32 = 60;
#[cfg(all(target_os = "windows", feature = "real-recording"))]
const FPS_DENOMINATOR: u32 = 1;
// Let the library infer window size; avoid forcing dimensions.
#[cfg(all(target_os = "windows", feature = "real-recording"))]
use windows::Win32::Foundation::{BOOL, HWND, LPARAM, RECT};
#[cfg(all(target_os = "windows", feature = "real-recording"))]
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GetClassNameW, GetClientRect, GetWindowRect, GetWindowTextW, IsWindowVisible,
};

#[cfg(all(target_os = "windows", feature = "real-recording"))]
pub struct WindowsRecorder {
    is_recording: bool,
    recorder: Option<Arc<Mutex<WinRecorder>>>,
    output_path: Option<String>,
}

#[cfg(all(target_os = "windows", feature = "real-recording"))]
unsafe impl Send for WindowsRecorder {}

#[cfg(all(target_os = "windows", feature = "real-recording"))]
impl WindowsRecorder {
    pub fn new() -> Self {
        Self {
            is_recording: false,
            recorder: None,
            output_path: None,
        }
    }

    fn find_dolphin_process_name(&self) -> Result<(String, bool), Error> {
        // Prefer an explicitly selected window provided via env
        if let Ok(pid_str) = std::env::var("PEPPI_TARGET_PID") {
            if let Ok(pid) = pid_str.parse::<u32>() {
                if let Some(title) = resolve_title_by_pid(pid) {
                    log::info!("Using title via PID {}: {}", pid, title);
                    return Ok((title, true));
                }
            }
        }
        if let Ok(mut raw) = std::env::var("PEPPI_TARGET_WINDOW") {
            let trimmed = raw.trim().to_string();
            if let Some(idx) = trimmed.rfind("(PID:") {
                let title = trimmed[..idx].trim_end().to_string();
                if !title.is_empty() {
                    log::info!("Using provided target window: {}", title);
                    return Ok((title, true));
                }
            }
            if !trimmed.is_empty() {
                log::info!("Using provided target window: {}", trimmed);
                return Ok((trimmed, true));
            }
        }

        // Default fallback if nothing provided
        let default_name = "Slippi Dolphin.exe";
        log::info!("Using default target: {}", default_name);
        Ok((default_name.to_string(), false))
    }

    fn initialize_recorder(&mut self, output_path: &str) -> Result<(), Error> {
        let (process_name, prefer_exact_match) = self.find_dolphin_process_name()?;
        log::info!("Targeting process/window: {}", process_name);
        // Allow windows-record to capture even when the target window loses focus
        std::env::set_var("WINDOWS_RECORD_REQUIRE_FOCUS", "0");

        // Ensure output directory exists
        if let Some(parent) = std::path::Path::new(output_path).parent() {
            if !parent.as_os_str().is_empty() {
                std::fs::create_dir_all(parent).map_err(|err| {
                    Error::RecordingFailed(format!("Failed to create output directory: {err}"))
                })?;
            }
        }

        // Configure the recorder using builder pattern
        let mut builder = WinRecorder::builder()
            .fps(DEFAULT_FPS, FPS_DENOMINATOR)
            .capture_audio(true)
            // windows-record notes cursor capture is unstable with NV12/GDI, so disable it
            .capture_cursor(false)
            .output_path(output_path);

        // Optionally honor a hint for final encode dimensions using the selected window.
        let size_hint = std::env::var("PEPPI_TARGET_WINDOW")
            .ok()
            .and_then(|target| get_client_even_size_from_title(&target))
            .or_else(|| get_client_even_size_from_title(&process_name));
        if let Some((w, h)) = size_hint {
            log::info!("Using window-derived output dimensions: {}x{}", w, h);
            builder = builder.output_dimensions(w, h);
        }

        let config = builder.build();

        // Create recorder instance and target the Dolphin window/process
        let recorder = WinRecorder::new(config)
            .map_err(|e| Error::InitializationError(format!("Failed to create recorder: {:?}", e)))?
            .with_process_name(&process_name)
            .with_exact_match(prefer_exact_match);

        self.recorder = Some(Arc::new(Mutex::new(recorder)));
        self.output_path = Some(output_path.to_string());
        Ok(())
    }
}

#[cfg(all(target_os = "windows", feature = "real-recording"))]
impl Recorder for WindowsRecorder {
    fn start_recording(&mut self, output_path: &str) -> Result<(), Error> {
        if self.is_recording {
            return Err(Error::RecordingFailed("Already recording".into()));
        }

        log::info!("[Windows] Starting recording to {}", output_path);
        self.initialize_recorder(output_path)?;

        if let Some(recorder_arc) = &self.recorder {
            let recorder = recorder_arc.lock().map_err(|e| {
                Error::InitializationError(format!("Failed to lock recorder: {}", e))
            })?;

            recorder.start_recording().map_err(|e| {
                Error::RecordingFailed(format!("Failed to start recording: {:?}", e))
            })?;
        } else {
            return Err(Error::InitializationError(
                "Recorder was not initialized".into(),
            ));
        }

        self.is_recording = true;
        log::info!("[Windows] Recording started");
        Ok(())
    }

    fn stop_recording(&mut self) -> Result<String, Error> {
        if !self.is_recording {
            return Err(Error::RecordingFailed("Not recording".into()));
        }

        log::info!("[Windows] Stopping recording");

        let stop_result = (|| -> Result<(), Error> {
            if let Some(recorder_arc) = &self.recorder {
                let recorder = recorder_arc.lock().map_err(|e| {
                    Error::RecordingFailed(format!("Failed to lock recorder: {}", e))
                })?;

                recorder.stop_recording().map_err(|e| {
                    Error::RecordingFailed(format!("Failed to stop recording: {:?}", e))
                })?;
            }
            Ok(())
        })();

        let output_path = self
            .output_path
            .clone()
            .unwrap_or_else(|| "recording.mp4".into());

        self.recorder = None;
        self.output_path = None;
        self.is_recording = false;

        stop_result?;
        log::info!("[Windows] Recording saved to {}", output_path);
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

#[cfg(all(target_os = "windows", feature = "real-recording"))]
fn get_client_even_size_from_title(title_substr: &str) -> Option<(u32, u32)> {
    struct Ctx<'a> {
        needle: &'a str,
        found: Option<HWND>,
    }
    unsafe extern "system" fn enum_cb(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let ctx = &mut *(lparam.0 as *mut Ctx);
        if ctx.found.is_some() {
            return BOOL(1);
        }
        let mut buf: [u16; 512] = [0; 512];
        let len = GetWindowTextW(hwnd, &mut buf);
        if len > 0 {
            let title = String::from_utf16_lossy(&buf[..len as usize]).to_lowercase();
            if title.contains(ctx.needle) {
                ctx.found = Some(hwnd);
                return BOOL(0);
            }
        }
        BOOL(1)
    }

    // Strip optional " (PID: NNN)" suffix our UI appends, then lowercase
    let mut cleaned = title_substr.trim().to_string();
    if let Some(idx) = cleaned.rfind("(PID:") {
        cleaned = cleaned[..idx].trim_end().to_string();
    }
    let needle = cleaned.to_lowercase();
    let mut ctx = Ctx {
        needle: &needle,
        found: None,
    };
    unsafe {
        let _ = EnumWindows(Some(enum_cb), LPARAM(&mut ctx as *mut _ as isize));
    }
    let hwnd = ctx.found?;

    let mut rect = RECT::default();
    unsafe {
        if GetClientRect(hwnd, &mut rect).is_err() {
            return None;
        }
    }
    let mut w = (rect.right - rect.left).max(0) as u32;
    let mut h = (rect.bottom - rect.top).max(0) as u32;
    // NV12 requires even; keep even only (wider 16-align caused black output on some paths).
    if w % 2 == 1 {
        w -= 1;
    }
    if h % 2 == 1 {
        h -= 1;
    }
    if w < 2 || h < 2 {
        return None;
    }
    Some((w, h))
}

#[cfg(all(target_os = "windows", feature = "real-recording"))]
fn resolve_title_by_pid(target_pid: u32) -> Option<String> {
    // Collect (hwnd, title, class, w, h, visible)
    unsafe extern "system" fn cb(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let data = &mut *(lparam.0 as *mut (u32, Vec<(HWND, String, String, i32, i32, bool)>));
        let mut pid: u32 = 0;
        windows::Win32::UI::WindowsAndMessaging::GetWindowThreadProcessId(hwnd, Some(&mut pid));
        if pid == data.0 {
            let mut title_buf: [u16; 512] = [0; 512];
            let len = GetWindowTextW(hwnd, &mut title_buf);
            let title = if len > 0 {
                String::from_utf16_lossy(&title_buf[..len as usize])
            } else {
                String::new()
            };

            let mut class_buf: [u16; 256] = [0; 256];
            let clen = GetClassNameW(hwnd, &mut class_buf);
            let class_name = if clen > 0 {
                String::from_utf16_lossy(&class_buf[..clen as usize])
            } else {
                String::new()
            };

            let visible = IsWindowVisible(hwnd).as_bool();

            let mut rect = RECT::default();
            let (w, h) = if GetWindowRect(hwnd, &mut rect).is_ok() {
                (rect.right - rect.left, rect.bottom - rect.top)
            } else {
                (0, 0)
            };

            data.1.push((hwnd, title, class_name, w, h, visible));
        }
        BOOL(1)
    }

    let mut coll: (u32, Vec<(HWND, String, String, i32, i32, bool)>) = (target_pid, Vec::new());
    unsafe {
        let _ = EnumWindows(Some(cb), LPARAM(&mut coll as *mut _ as isize));
    }
    if coll.1.is_empty() {
        return None;
    }

    // Score candidates: prefer Dolphin main window; avoid dummy/OpenGL pbuffers, dialogs, tooltips
    fn score(title: &str, class_name: &str, w: i32, h: i32, visible: bool) -> i32 {
        let t = title.to_lowercase();
        let c = class_name.to_lowercase();
        let mut s = 0;
        if visible {
            s += 2;
        }
        if c.contains("wxwindownr") {
            s += 10;
        }
        if t.contains("slippi") || t.contains("melee") || t.contains("dolphin") {
            s += 5;
        }
        if c.contains("nvopenglpbuffer")
            || t.contains("__wgldummywindowfodder")
            || t.contains("nvogldc invisible")
        {
            s -= 20;
        }
        if c.starts_with("#32770") || c.contains("tooltips") {
            s -= 10;
        }
        if w > 300 && h > 200 {
            s += 2;
        }
        s
    }

    coll.1
        .into_iter()
        .filter(|(_, t, _, w, h, _)| !t.is_empty() && *w > 100 && *h > 100)
        .max_by_key(|(_, t, c, w, h, vis)| (score(t, c, *w, *h, *vis), (*w as i64) * (*h as i64)))
        .map(|(_, t, _, _, _, _)| t)
}
