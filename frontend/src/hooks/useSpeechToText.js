import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Speech-to-Text hook built on the browser's Web Speech API (SpeechRecognition).
 * Streams a live transcript while the user speaks so answers can be dictated.
 * No backend or API key required.
 *
 * @param {object} [options]
 * @param {(chunk: string) => void} [options.onFinalTranscript] Called with each
 *   finalized chunk of speech, so callers can append it to their own state.
 * @param {number} [options.silenceTimeout] Milliseconds of silence after which
 *   the mic auto-stops. 0 (default) disables auto-stop.
 * @param {() => void} [options.onSilence] Called when the mic auto-stops due to silence.
 */
export function useSpeechToText({ onFinalTranscript, silenceTimeout = 0, onSilence } = {}) {
    const Recognition =
        typeof window !== "undefined"
            ? window.SpeechRecognition || window.webkitSpeechRecognition
            : null;
    const supported = Boolean(Recognition);

    const [listening, setListening] = useState(false);
    // The live, not-yet-finalized guess shown while the user is mid-sentence.
    const [interimTranscript, setInterimTranscript] = useState("");
    const [error, setError] = useState(null);

    const recognitionRef = useRef(null);
    const shouldListenRef = useRef(false);
    const silenceTimerRef = useRef(null);
    // Keep the latest callbacks/config in refs so the recognition instance
    // (created once) always sees current values without being re-created.
    const onFinalRef = useRef(onFinalTranscript);
    const onSilenceRef = useRef(onSilence);
    const silenceTimeoutRef = useRef(silenceTimeout);
    useEffect(() => {
        onFinalRef.current = onFinalTranscript;
        onSilenceRef.current = onSilence;
        silenceTimeoutRef.current = silenceTimeout;
    }, [onFinalTranscript, onSilence, silenceTimeout]);

    const clearSilenceTimer = () => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    };

    useEffect(() => {
        if (!Recognition) return;

        const recognition = new Recognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        // Restart the countdown to auto-stop whenever we hear something.
        const armSilenceTimer = () => {
            clearSilenceTimer();
            const timeout = silenceTimeoutRef.current;
            if (!timeout) return;
            silenceTimerRef.current = setTimeout(() => {
                shouldListenRef.current = false;
                recognition.stop();
                setListening(false);
                setInterimTranscript("");
                onSilenceRef.current?.();
            }, timeout);
        };

        recognition.onresult = (event) => {
            let interim = "";
            let final = "";

            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript;
                } else {
                    interim += transcript;
                }
            }

            if (final && onFinalRef.current) {
                onFinalRef.current(final.trim());
            }
            setInterimTranscript(interim);
            armSilenceTimer(); // heard speech → reset the silence countdown
        };

        recognition.onspeechstart = armSilenceTimer;
        recognition.onaudiostart = armSilenceTimer;

        recognition.onerror = (event) => {
            // "no-speech" and "aborted" are routine; surface everything else.
            if (event.error !== "no-speech" && event.error !== "aborted") {
                setError(event.error);
            }
        };

        recognition.onend = () => {
            // Auto-restart if the user is still meant to be listening (browsers
            // stop recognition periodically on their own).
            if (shouldListenRef.current) {
                try {
                    recognition.start();
                } catch {
                    setListening(false);
                }
            } else {
                clearSilenceTimer();
                setListening(false);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            shouldListenRef.current = false;
            clearSilenceTimer();
            recognition.stop();
        };
    }, [Recognition]);

    const start = useCallback(() => {
        if (!recognitionRef.current || shouldListenRef.current) return;
        setError(null);
        setInterimTranscript("");
        shouldListenRef.current = true;
        try {
            recognitionRef.current.start();
            setListening(true);
        } catch {
            // start() throws if already started; ignore.
        }
    }, []);

    const stop = useCallback(() => {
        if (!recognitionRef.current) return;
        shouldListenRef.current = false;
        clearSilenceTimer();
        recognitionRef.current.stop();
        setListening(false);
        setInterimTranscript("");
    }, []);

    return {
        supported,
        listening,
        interimTranscript,
        error,
        start,
        stop,
    };
}

export default useSpeechToText;
