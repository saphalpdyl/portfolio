import { actions } from "astro:actions";
import { useEffect, useState } from "react";

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
  
  async function refreshProcessStatus() {
    // @ts-ignore
    const [hasData, data] = (await actions.getProcessStatus()).data;

    if (!hasData) return null;

    setProcessData(data);
  }
  
  useEffect(() => {
    refreshProcessStatus();
    const _interval = setInterval(refreshProcessStatus, 2000);
    
    return () => {
      clearInterval(_interval);
    }
  }, []);

  if (!processData) return <span className="text-xs font-serif">Saphal is not connected.</span>
  
  return <div className="flex gap-4 ">
    {
      Object.keys(processData).map(processName => {
        if (!(processName in APP_TO_IMAGE_ICON_HASHMAP )) return null;
        
        return <div 
          className={`
              h-8 w-8 
              ${processData[processName] ? "scale-110" : "scale-100"}
              transition-all 
            `}
          style={{
            filter: `grayscale(${processData[processName] == false ? "1.0": "0.0"})`
          }}
          >
          <img src={`/public/${APP_TO_IMAGE_ICON_HASHMAP[processName]}`} alt="Icon" />
        </div>
      })
    }
  </div>;
}

export default CurrentlyRunningApplication;