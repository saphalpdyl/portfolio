import { actions } from "astro:actions";
import {
  CurrentlyRunningApplication as SharedCurrentlyRunningApplication,
  type ProcessStatusResult,
} from "@saphal/shared";

async function fetchProcessStatus(): Promise<ProcessStatusResult> {
  const response = await actions.getProcessStatus();
  if (!response?.data) return [false, {}, null];
  return response.data as ProcessStatusResult;
}

export default function CurrentlyRunningApplication() {
  return (
    <SharedCurrentlyRunningApplication
      fetchProcessStatus={fetchProcessStatus}
    />
  );
}
