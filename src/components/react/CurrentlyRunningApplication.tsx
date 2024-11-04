import { actions } from "astro:actions";
import { useEffect, useRef, useState } from "react";

const APP_TO_IMAGE_ICON_HASHMAP: {
  [_: string]: string,
} = {
  "Android Studio": "android-studio-icon.svg",
  "Visual Studio Code": "vscode.svg",
  "Postman": "postman.svg",
  "Visual Studio IDE": "visual_studio.svg",
  "Obsidian": "obsidian-icon.svg",
  "Chrome": "chrome.svg"
};

// Constants for timing
const POLLING_INTERVAL = 2000; // 2 seconds
const CONNECTION_TIMEOUT = 10000; // 10 seconds
const STALE_DATA_THRESHOLD = 7000; // 7 seconds - earlier than timeout to prevent flicker

interface OnlineStatusChipProps {
  isConnected: boolean;
  onlineServices: number;
}

function OnlineStatusChip({
  isConnected,
  onlineServices,
}: OnlineStatusChipProps) {
  return <div className="rounded-full underline py-1 px-2 flex items-center gap-2">
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
        : "Away" 
      }
    </span>
  </div>;
}

function CurrentlyRunningApplication() {
  const [processData, setProcessData] = useState<{
    [_: string]: boolean,
  } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const lastSuccessfulUpdateRef = useRef<number>(Date.now());
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const createEmptyProcessData = () => {
    const emptyHashMap: { [_: string]: boolean } = {};
    Object.keys(APP_TO_IMAGE_ICON_HASHMAP).forEach(processName => 
      emptyHashMap[processName] = false
    );
    return emptyHashMap;
  };

  const checkConnectionStatus = (lastUpdateTime: number) => {
    const timeSinceLastUpdate = Date.now() - lastUpdateTime;
    return timeSinceLastUpdate <= STALE_DATA_THRESHOLD;
  };

  async function refreshProcessStatus() {
    try {
      //@ts-ignore
      const [hasData, data, lastUpdateTime] = (await actions.getProcessStatus()).data;
      
      if (!hasData || !data) {
        setIsConnected(false);
        setProcessData(createEmptyProcessData());
        return;
      }

      const isDataFresh = checkConnectionStatus(lastUpdateTime);
      
      if (!isDataFresh) {
        setIsConnected(false);
        setProcessData(createEmptyProcessData());
        return;
      }

      lastSuccessfulUpdateRef.current = Date.now();
      setIsConnected(true);
      setProcessData(data);
      setIsInitialLoad(false);
    } catch (error) {
      console.error("Failed to refresh process status:", error);
      setIsConnected(false);
      setProcessData(createEmptyProcessData());
    }
  }
  
  useEffect(() => {
    // Initial load
    refreshProcessStatus();

    // Set up polling with error handling and cleanup
    const startPolling = () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
      
      pollTimeoutRef.current = setTimeout(async () => {
        await refreshProcessStatus();
        startPolling();
      }, POLLING_INTERVAL);
    };

    startPolling();

    // Connection status checker
    const connectionChecker = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - lastSuccessfulUpdateRef.current;
      if (timeSinceLastUpdate > CONNECTION_TIMEOUT) {
        setIsConnected(false);
        setProcessData(createEmptyProcessData());
      }
    }, 1000);

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
      clearInterval(connectionChecker);
    };
  }, []);

  if (isInitialLoad) {
    return <span className="text-xs font-serif">Connecting...</span>;
  }

  return (
    <div className="flex flex-col border-[1px] bg-gray-100/60 shadow-sm border-gray-100 rounded-lg py-1 px-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-serif text-gray-600">Applications Running</span>
        <OnlineStatusChip
          isConnected={isConnected}
          onlineServices={Object.values(processData || {}).filter(value => value === true).length}
        />
      </div>
      <div className="flex gap-4 flex-wrap">
        {Object.keys(APP_TO_IMAGE_ICON_HASHMAP).map(processName => {
          if (!processData || !(processName in processData)) return null;
          
          return (
            <div 
              key={processName}
              className={`
                h-8 w-8 
                ${processData[processName] ? "scale-110" : "scale-90"}
                transition-all ease-in-out duration-500
              `}
              style={{
                filter: `grayscale(${processData[processName] === false ? "1.0": "0.0"})`
              }}
            >
              <img src={`/${APP_TO_IMAGE_ICON_HASHMAP[processName]}`} alt={`${processName} icon`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CurrentlyRunningApplication;