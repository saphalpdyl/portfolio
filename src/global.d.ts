declare global 
  type FreeBusyStatus = {
  status: "busy" | "free";
} & (
  { status: "busy", freeAt: Date | null}
  | { status: "free"; busyAt: Date | null}
);