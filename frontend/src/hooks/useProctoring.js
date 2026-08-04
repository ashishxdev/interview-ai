import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lightweight proctoring hook for interview sessions.
 *
 * - Tracks fullscreen state and offers helpers to enter/exit fullscreen.
 * - Counts "violations": switching tabs/minimizing (visibilitychange) or
 *   leaving fullscreen while the interview is active.
 * - Exposes the most recent violation so the UI can warn the candidate.
 *
 * @param {object} [options]
 * @param {boolean} [options.active] When false, violations are not counted.
 */
export function useProctoring({ active = true } = {}) {
    const [isFullscreen, setIsFullscreen] = useState(
        typeof document !== "undefined" ? Boolean(document.fullscreenElement) : false
    );
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
    const [lastViolation, setLastViolation] = useState(null); // { type, at } | null

    const activeRef = useRef(active);
    useEffect(() => {
        activeRef.current = active;
    }, [active]);

    const enterFullscreen = useCallback(async () => {
        const el = document.documentElement;
        try {
            if (el.requestFullscreen) await el.requestFullscreen();
        } catch {
            // User gesture required or unsupported; ignore.
        }
    }, []);

    const exitFullscreen = useCallback(async () => {
        try {
            if (document.fullscreenElement && document.exitFullscreen) {
                await document.exitFullscreen();
            }
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        // Tab switch / window minimize.
        const handleVisibility = () => {
            if (document.hidden && activeRef.current) {
                setTabSwitchCount((count) => count + 1);
                setLastViolation({ type: "tab-switch" });
            }
        };

        // Entering/leaving fullscreen.
        const handleFullscreenChange = () => {
            const active = Boolean(document.fullscreenElement);
            setIsFullscreen(active);
            if (!active && activeRef.current) {
                setFullscreenExitCount((count) => count + 1);
                setLastViolation({ type: "fullscreen-exit" });
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);
        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    const dismissViolation = useCallback(() => setLastViolation(null), []);

    return {
        isFullscreen,
        tabSwitchCount,
        fullscreenExitCount,
        violationCount: tabSwitchCount + fullscreenExitCount,
        lastViolation,
        enterFullscreen,
        exitFullscreen,
        dismissViolation,
    };
}

export default useProctoring;
