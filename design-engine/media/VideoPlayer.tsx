"use client";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import type { SectionImage, SectionVideo } from "./types";
import { videoAsAsset } from "./source";

const mobileSnapshot = () => matchMedia("(max-width:700px)").matches;
const serverMobileSnapshot = () => false;
function subscribeMobile(onChange: () => void) {
  const query = matchMedia("(max-width:700px)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
export function SectionVideoPlayer({
  video,
  className = "",
}: {
  video: SectionVideo;
  className?: string;
}) {
  return <VideoPlayer asset={videoAsAsset(video)} className={className} />;
}
/** Native playback remains separate from image-selection links/buttons. */
export function VideoPlayer({
  asset,
  className = "",
  imageClassName = "",
  style,
  preview = false,
  onError,
}: {
  asset: SectionImage;
  className?: string;
  imageClassName?: string;
  style?: CSSProperties;
  preview?: boolean;
  onError?: () => void;
}) {
  const main = useRef<HTMLVideoElement>(null),
    modal = useRef<HTMLDialogElement>(null),
    large = useRef<HTMLVideoElement>(null),
    opener = useRef<HTMLButtonElement>(null);
  const uid = useId(),
    options = asset.playback ?? {};
  const mobile = useSyncExternalStore(
      subscribeMobile,
      mobileSnapshot,
      serverMobileSnapshot,
    ),
    source = mobile && options.mobileSrc ? options.mobileSrc : asset.src;
  const [enlarged, setEnlarged] = useState(false),
    [failed, setFailed] = useState(false);
  const resume = useRef({ time: 0, playing: false });
  const enlargedRef = useRef(false);
  const controls = !preview && options.controls !== false,
    muted = preview || Boolean(options.autoplay) || Boolean(options.muted);
  useEffect(() => {
    const video = main.current;
    if (!video) return;
    let visible = false,
      wantsPlayback =
        Boolean(options.autoplay) &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches,
      automaticPause = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (!visible || document.hidden || enlargedRef.current) {
        if (!video.paused) {
          automaticPause = true;
          video.pause();
        }
      } else if (wantsPlayback) void video.play().catch(() => {});
    };
    const onPlay = () => {
      wantsPlayback = true;
    };
    const onPause = () => {
      if (automaticPause) automaticPause = false;
      else wantsPlayback = false;
    };
    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      sync();
    });
    observer.observe(video);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    document.addEventListener("visibilitychange", sync);
    const onMotionChange = () => {
      if (reduced.matches) {
        wantsPlayback = false;
        video.pause();
      }
    };
    reduced.addEventListener("change", onMotionChange);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", onMotionChange);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.pause();
    };
  }, [source, options.autoplay]);
  useEffect(() => {
    if (enlarged) modal.current?.showModal();
  }, [enlarged]);
  function toggle(video: HTMLVideoElement) {
    if (video.paused) void video.play().catch(() => {});
    else video.pause();
  }
  function close() {
    if (large.current && main.current) {
      main.current.currentTime = large.current.currentTime;
      const playing = !large.current.paused;
      large.current.pause();
      if (playing)
        requestAnimationFrame(() => {
          void main.current?.play().catch(() => {});
        });
    }
    modal.current?.close();
    enlargedRef.current = false;
    setEnlarged(false);
    opener.current?.focus();
  }
  return (
    <span
      className={`de-video ${className}`}
      style={style}
      data-preview={preview || undefined}
      data-controls={controls}
    >
      {failed ? (
        <span className="de-video-unavailable" role="status">
          {asset.alt} · Video unavailable
        </span>
      ) : (
        <video
          key={source}
          ref={main}
          className={imageClassName}
          src={source}
          poster={options.poster}
          width={asset.width}
          height={asset.height}
          aria-label={asset.alt}
          controls={controls}
          loop={Boolean(options.loop)}
          muted={muted}
          playsInline
          preload={preview ? "metadata" : "none"}
          tabIndex={!controls && !preview ? 0 : undefined}
          onClick={(event) => {
            if (!controls && !preview) {
              event.stopPropagation();
              toggle(event.currentTarget);
            }
          }}
          onKeyDown={(event) => {
            if (
              !controls &&
              !preview &&
              (event.key === " " || event.key === "Enter")
            ) {
              event.preventDefault();
              event.stopPropagation();
              toggle(event.currentTarget);
            }
          }}
          onPointerDown={(event) => {
            if (!preview) event.stopPropagation();
          }}
          onError={() => {
            setFailed(true);
            onError?.();
          }}
        >
          {options.captions && (
            <track
              default
              kind="captions"
              src={options.captions.src}
              srcLang={options.captions.language}
              label={options.captions.label}
            />
          )}
        </video>
      )}
      {!preview && options.enlarge !== false && !failed && (
        <button
          ref={opener}
          type="button"
          className="de-video-enlarge"
          aria-label={`Enlarge video: ${asset.alt}`}
          onClick={(event) => {
            event.stopPropagation();
            resume.current = {
              time: main.current?.currentTime ?? 0,
              playing: !main.current?.paused,
            };
            enlargedRef.current = true;
            main.current?.pause();
            setEnlarged(true);
          }}
        >
          ↗<span className="de-visually-hidden">Enlarge video</span>
        </button>
      )}
      {!preview && options.transcript && (
        <details className="de-video-transcript">
          <summary>Video transcript</summary>
          <p>{options.transcript}</p>
        </details>
      )}
      {!preview && (
        <dialog
          ref={modal}
          className="de-video-dialog"
          aria-labelledby={`${uid}-title`}
          onCancel={(event) => {
            event.preventDefault();
            close();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          {enlarged && (
            <>
              <h2 id={`${uid}-title`}>{asset.alt}</h2>
              <button
                type="button"
                autoFocus
                className="de-video-close"
                onClick={close}
              >
                Close video
              </button>
              <video
                key={source}
                ref={large}
                src={source}
                poster={options.poster}
                aria-label={asset.alt}
                controls={controls}
                loop={Boolean(options.loop)}
                muted={muted}
                playsInline
                preload="metadata"
                onLoadedMetadata={(event) => {
                  event.currentTarget.currentTime = resume.current.time;
                  if (resume.current.playing)
                    void event.currentTarget.play().catch(() => {});
                }}
                tabIndex={controls ? undefined : 0}
                onClick={(event) => {
                  if (!controls) toggle(event.currentTarget);
                }}
                onKeyDown={(event) => {
                  if (
                    !controls &&
                    (event.key === " " || event.key === "Enter")
                  ) {
                    event.preventDefault();
                    toggle(event.currentTarget);
                  }
                }}
              >
                {options.captions && (
                  <track
                    default
                    kind="captions"
                    src={options.captions.src}
                    srcLang={options.captions.language}
                    label={options.captions.label}
                  />
                )}
              </video>
              {options.transcript && (
                <details>
                  <summary>Video transcript</summary>
                  <p>{options.transcript}</p>
                </details>
              )}
            </>
          )}
        </dialog>
      )}
    </span>
  );
}
