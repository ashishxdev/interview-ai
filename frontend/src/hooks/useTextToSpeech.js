import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Text-to-Speech hook built on the browser's Web Speech API (speechSynthesis).
 * Lets the AI interviewer read questions aloud. No backend or API key required.
 */
export function useTextToSpeech() {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    const supported = Boolean(synth);

    const [speaking, setSpeaking] = useState(false);
    const [voices, setVoices] = useState([]);
    const utteranceRef = useRef(null);

    // Load available voices (they populate asynchronously in most browsers).
    useEffect(() => {
        if (!synth) return;

        const loadVoices = () => setVoices(synth.getVoices());
        loadVoices();
        synth.addEventListener("voiceschanged", loadVoices);

        return () => synth.removeEventListener("voiceschanged", loadVoices);
    }, [synth]);

    const cancel = useCallback(() => {
        if (!synth) return;
        synth.cancel();
        setSpeaking(false);
    }, [synth]);

    const speak = useCallback(
        (text) => {
            if (!synth || !text) return;

            // Stop anything currently playing before starting a new utterance.
            synth.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.lang = "en-US";

            // Prefer a natural-sounding English voice when one is available.
            const preferred =
                voices.find((v) => /en(-|_)US/i.test(v.lang) && /female|natural|google|samantha|zira/i.test(v.name)) ||
                voices.find((v) => /^en/i.test(v.lang)) ||
                voices[0];
            if (preferred) utterance.voice = preferred;

            utterance.onstart = () => setSpeaking(true);
            utterance.onend = () => setSpeaking(false);
            utterance.onerror = () => setSpeaking(false);

            utteranceRef.current = utterance;
            synth.speak(utterance);
        },
        [synth, voices]
    );

    // Ensure speech is stopped when the component unmounts.
    useEffect(() => cancel, [cancel]);

    return { supported, speaking, speak, cancel };
}

export default useTextToSpeech;
