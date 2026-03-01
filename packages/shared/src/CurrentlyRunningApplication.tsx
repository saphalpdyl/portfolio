import { useEffect, useRef, useState } from "react";

import androidStudioIcon from "./assets/android-studio-icon.svg?url";
import vscodeSvg from "./assets/vscode.svg?url";
import postmanSvg from "./assets/postman.svg?url";
import visualStudioSvg from "./assets/visual_studio.svg?url";
import obsidianIcon from "./assets/obsidian-icon.svg?url";
import chromeSvg from "./assets/chrome.svg?url";
import unitySvg from "./assets/unity.svg?url";
import blenderPng from "./assets/blender.png?url";
import dockerPng from "./assets/docker.png?url";
import zenSvg from "./assets/zen.svg?url";
import firefoxPng from "./assets/firefox.png?url";

export const APP_TO_IMAGE_ICON_HASHMAP: {
  [_: string]: string;
} = {
  "Android Studio": androidStudioIcon,
  "Visual Studio Code": vscodeSvg,
  "Postman": postmanSvg,
  "Visual Studio IDE": visualStudioSvg,
  "Obsidian": obsidianIcon,
  "Chrome": chromeSvg,
  "Unity": unitySvg,
  "Blender": blenderPng,
  "Docker Desktop": dockerPng,
  "Zen": zenSvg,
  "Firefox": firefoxPng,
};

export type ProcessStatusResult = [boolean, { [_: string]: boolean }, string | null];

interface OnlineStatusChipProps {
  isConnected: boolean;
  onlineServices: number;
}

function OnlineStatusChip({
  isConnected,
  onlineServices,
}: OnlineStatusChipProps) {
  return (
    <div className="rounded-full underline py-1 px-2 flex items-center gap-2">
      <div
        className={`
        w-2 h-2
        rounded-full
        ring-1 ring-offset-1
        animate-pulse
        ${isConnected ? "bg-green-500 ring-green-600" : "bg-red-500 ring-red-600"}
      `}
      ></div>
      <span className="text-[10px] text-gray-600 font-serif">
        {isConnected
          ? `${onlineServices > 0 ? "Active" : "Online"}`
          : "Away"}
      </span>
    </div>
  );
}

export interface CurrentlyRunningApplicationProps {
  fetchProcessStatus: () => Promise<ProcessStatusResult>;
}

export function CurrentlyRunningApplication({
  fetchProcessStatus
}: CurrentlyRunningApplicationProps) {
  const [processData, setProcessData] = useState<{
    [_: string]: boolean,
  } | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const lastSuccessfulUpdateRef = useRef<number>(Date.now());
  
  async function refreshProcessStatus() {
    try {
      // @ts-ignore
      const [hasData, data, lastUpdateTime] = (await fetchProcessStatus());
      
      const timeSinceLastUpdate = Date.now() - Date.parse(lastUpdateTime);
      
      if (!hasData || timeSinceLastUpdate > 10000) {
        setIsConnected(false);
        const emptyHashMap: {
          [_: string]: boolean,
        } = {};
        Object.keys(APP_TO_IMAGE_ICON_HASHMAP).forEach(processName => emptyHashMap[processName] = false);
        setProcessData(emptyHashMap);
        return;
      }

      // Update the last successful update timestamp if we got valid data
      if (hasData && data && Object.keys(data).length > 0) {
        lastSuccessfulUpdateRef.current = Date.now();
        setIsConnected(true);
        setProcessData(data);
      }

      // Check if data is stale (no updates in last 20 seconds)
    } catch (error) {
      console.error("Failed to refresh process status:", error);
      setIsConnected(false);
    }
  }
  
  useEffect(() => {
    refreshProcessStatus();
    const interval = setInterval(refreshProcessStatus, 2000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  if (!processData) return <span className="text-md font-serif">Connecting...</span>;
  
  return (
    <div className="flex flex-col border-[1px] bg-gray-100/60 shadow-sm border-gray-100 rounded-lg py-1 px-2">
      <div className="flex justify-between items-center">
      <span className="text-xs font-serif text-gray-600">Applications running on my machine</span>
      <OnlineStatusChip
        isConnected={isConnected}
        onlineServices={Object.values(processData).filter(value => value === true).length}
      />
      </div>
      <div className="flex gap-4 flex-wrap">
        {Object.keys(APP_TO_IMAGE_ICON_HASHMAP).map(processName => {
          if (!(processName in processData)) return null;
          
          return (
            <div 
              key={processName}
              className={`
                h-8 w-8 
                ${processData[processName] ? "scale-110" : "scale-90"}
                hover:scale-110
                transition-all ease-in-out duration-500
                hover:grayscale-0 grayscale
                ${processData[processName] === false ? "grayscale" : "grayscale-0"}
              `}
              title={processName}
            >
              <img src={`${APP_TO_IMAGE_ICON_HASHMAP[processName]}`} alt={`${processName} icon`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CurrentlyRunningApplication;