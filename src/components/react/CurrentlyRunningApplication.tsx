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

function CurrentlyRunningApplication() {
  const [processData, setProcessData] = useState<{
    [_: string]: boolean,
  } | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const lastSuccessfulUpdateRef = useRef<number>(Date.now());
  
  async function refreshProcessStatus() {
    try {
      // @ts-ignore
      const [hasData, data, previousTimestamp] = (await actions.getProcessStatus()).data;
      
      if (!hasData) {
        setIsConnected(false);
        return;
      }

      // Update the last successful update timestamp if we got valid data
      if (data && Object.keys(data).length > 0) {
        lastSuccessfulUpdateRef.current = Date.now();
        setIsConnected(true);
        setProcessData(data);
      }

      // Check if data is stale (no updates in last 20 seconds)
      const timeSinceLastUpdate = Date.now() - lastSuccessfulUpdateRef.current;
      if (timeSinceLastUpdate > 20000) {
        setIsConnected(false);
      }
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

  if (!processData) return <span className="text-xs font-serif">Connecting...</span>;
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-4">
        {Object.keys(APP_TO_IMAGE_ICON_HASHMAP).map(processName => {
          if (!(processName in processData)) return null;
          
          return (
            <div 
              key={processName}
              className={`
                h-8 w-8 
                ${processData[processName] ? "scale-110" : "scale-100"}
                transition-all 
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
      <span className="text-xs italic text-gray-600 font-serif">
        {isConnected 
          ? `I am ${Object.values(processData).filter(value => value === true).length > 0 ? "cooking" : "online"}.`
          : "I am AFK right now."
        }
      </span>
    </div>
  );
}

export default CurrentlyRunningApplication;