import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Per-question countdown timer. Mount with a `key` (e.g. the question id) so each
 * question gets a fresh clock. Calls `onExpire` once when it hits zero. Display
 * turns amber, then red, as time runs low.
 *
 * @param {object} props
 * @param {number} props.seconds Total seconds to count down from.
 * @param {() => void} [props.onExpire] Called once when the timer reaches zero.
 */
function QuestionTimer({ seconds, onExpire }) {
    const [remaining, setRemaining] = useState(seconds);
    const onExpireRef = useRef(onExpire);
    useEffect(() => {
        onExpireRef.current = onExpire;
    }, [onExpire]);

    useEffect(() => {
        let current = seconds;

        const interval = setInterval(() => {
            current -= 1;
            setRemaining(current);
            if (current <= 0) {
                clearInterval(interval);
                onExpireRef.current?.();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [seconds]);

    const isCritical = remaining <= 10;
    const isWarning = remaining <= 30 && !isCritical;

    const tone = isCritical
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : isWarning
          ? "bg-amber-50 text-amber-700 ring-amber-200"
          : "bg-white text-slate-700 ring-slate-200";

    return (
        <span
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold tabular-nums ring-1 transition-colors ${tone}`}
            role="timer"
            aria-live="off"
        >
            <Clock className={`h-4 w-4 ${isCritical ? "animate-pulse" : ""}`} />
            {formatTime(Math.max(remaining, 0))}
        </span>
    );
}

export default QuestionTimer;
