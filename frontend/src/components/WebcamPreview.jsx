import { useEffect, useRef, useState } from "react";
import { Video, VideoOff } from "lucide-react";

/**
 * Live webcam preview using getUserMedia. Shown during an interview session so
 * the candidate can see themselves, mimicking a real proctored interview.
 * Video is preview-only — nothing is recorded or uploaded.
 */
function WebcamPreview() {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [status, setStatus] = useState(() =>
        typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia ? "loading" : "unsupported"
    ); // loading | ready | denied | unsupported

    useEffect(() => {
        if (status !== "loading") return;

        let cancelled = false;

        navigator.mediaDevices
            .getUserMedia({ video: true, audio: false })
            .then((stream) => {
                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setStatus("ready");
            })
            .catch(() => {
                if (!cancelled) setStatus("denied");
            });

        return () => {
            cancelled = true;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        };
        // Only run once on mount; `status` is intentionally read at mount time.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
                <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <Video className="h-4 w-4" />
                    Camera
                </span>
                {status === "ready" && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-rose-400">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                        </span>
                        Live
                    </span>
                )}
            </div>

            <div className="relative aspect-video w-full">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`h-full w-full object-cover ${status === "ready" ? "block" : "hidden"}`}
                    style={{ transform: "scaleX(-1)" }} // mirror like a selfie cam
                />

                {status !== "ready" && (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center text-slate-400">
                        {status === "loading" && (
                            <>
                                <Video className="h-6 w-6 animate-pulse" />
                                <p className="text-xs">Starting camera…</p>
                            </>
                        )}
                        {status === "denied" && (
                            <>
                                <VideoOff className="h-6 w-6" />
                                <p className="text-xs">Camera blocked. Enable access in your browser to show your preview.</p>
                            </>
                        )}
                        {status === "unsupported" && (
                            <>
                                <VideoOff className="h-6 w-6" />
                                <p className="text-xs">Camera is not supported in this browser.</p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default WebcamPreview;
