declare global 
  type FreeBusyStatus = {
  status: "busy" | "free";
} & (
  { status: "busy", freeAt: Date | null}
  | { status: "free"; busyAt: Date | null}
);

declare global
  type SpotifyCurrentlyPlaying = {
    status: "rate_limited" | "offline" | "playing",
} & (
  { 
    status: "playing",
    data: any, 
  }
  | { status: "rate_limited" }
  | { status: "offline" }
)