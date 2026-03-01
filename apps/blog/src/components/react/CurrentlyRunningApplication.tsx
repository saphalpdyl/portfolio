import { actions } from "astro:actions";
import {
  CurrentlyRunningApplication as SharedCurrentlyRunningApplication,
  type ProcessStatusResult,
} from "@saphal/shared";

async function fetchProcessStatus(): Promise<ProcessStatusResult> {
  // @ts-ignore
  const result = (await actions.getProcessStatus()).data;
  return result as ProcessStatusResult;
}

export default function CurrentlyRunningApplication() {
  return (
    <SharedCurrentlyRunningApplication
      fetchProcessStatus={fetchProcessStatus}
    />
  );
}
