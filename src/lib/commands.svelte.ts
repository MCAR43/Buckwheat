import { invoke } from '@tauri-apps/api/core';

export const preventDefault = <T extends Event>(fn: (e: T) => void): ((e: T) => void) => {
    return (e: T) => {
        e.preventDefault();
        fn(e);
    };
};

/**
 * Check if the Slippi/Dolphin game window is currently open
 * @returns Promise<boolean> - true if game window is detected
 */
export async function checkGameWindow(): Promise<boolean> {
    try {
        return await invoke<boolean>('check_game_window');
    } catch (error) {
        console.error('Failed to check game window:', error);
        return false;
    }
}

export interface GameWindow {
    process_name: string;
    window_title: string;
    width: number;
    height: number;
    process_id: number;
    class_name: string;
    is_cloaked: boolean;
    is_child: boolean;
    has_owner: boolean;
}

/**
 * List all detected game windows for user selection
 * @returns Promise<GameWindow[]> - array of detected game windows
 */
export async function listGameWindows(): Promise<GameWindow[]> {
    try {
        return await invoke<GameWindow[]>('list_game_windows');
    } catch (error) {
        console.error('Failed to list game windows:', error);
        return [];
    }
}

/**
 * Capture a single-frame preview of the selected game window.
 * @returns base64-encoded PNG string or null when unavailable
 */
export async function captureWindowPreview(): Promise<string | null> {
    try {
        return await invoke<string | null>('capture_window_preview');
    } catch (error) {
        console.error('Failed to capture window preview:', error);
        return null;
    }
}

/**
 * Get the currently stored game process name
 * @returns Promise<string | null> - the stored process name or null
 */
export async function getGameProcessName(): Promise<string | null> {
    try {
        return await invoke<string | null>('get_game_process_name');
    } catch (error) {
        console.error('Failed to get game process name:', error);
        return null;
    }
}

/**
 * Set the game process name to use for detection and recording
 * @param processName - the process name to store
 */
export async function setGameProcessName(processName: string): Promise<void> {
    try {
        await invoke('set_game_process_name', { processName });
    } catch (error) {
        console.error('Failed to set game process name:', error);
        throw error;
    }
}

export enum FILES {
    GREET_FILE = 'greet.txt',
    NAME_FILE = 'name.txt'
}

export class GlobalState {
    private _state = $state({ name: '', greet: '' });

    get greet() {
        return this._state.greet;
    }

    set greet(value: string) {
        this._state.greet = value;
    }

    get name() {
        return this._state.name;
    }

    set name(value: string) {
        this._state.name = value;
    }

    get nlen() {
        return this.name.length;
    }

    get glen() {
        return this.greet.length;
    }

    async read(path: FILES) {
        const contentFromFile = await invoke<string>('read', { path });
        if (path === FILES.NAME_FILE) {
            this.name = contentFromFile;
        } else if (path === FILES.GREET_FILE) {
            this.greet = contentFromFile;
        }
    }

    async write(path: FILES, contents: string) {
        await invoke('write', { path, contents });
        if (path === FILES.NAME_FILE) {
            this.name = contents;
        } else if (path === FILES.GREET_FILE) {
            this.greet = contents;
        }
    }

    reset() {
        this.name = '';
        this.greet = '';
    }
}
