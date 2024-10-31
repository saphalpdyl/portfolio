import { actions } from "astro:actions";
import { useEffect, useState } from "react";

const DATE_FORMAT_OPTIONS = { hour: '2-digit', minute: '2-digit' } satisfies Intl.DateTimeFormatOptions;

interface ChipProps {
  type: "loading" | "free" | "busy";
  text: string;
  note?: string;
}

function Chip({
  type,
  text,
  note
}: ChipProps) {
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="flex gap-2 justify-center items-center rounded-full bg-gray-100 px-2 py-1 ">
        <div className={`
          w-2 h-2 
          rounded-full
          ${type == "loading" ? "bg-yellow-500" : type == "busy" ? "bg-red-500" : "bg-green-500"}
          ring-2 ring-offset-1
          ${type == "loading" ? "ring-yellow-600" : type == "busy" ? "ring-red-600" : "ring-green-600"}
          animate-pulse
        `}></div>
        <span className={`
          text-xs font-serif
          ${type == "loading" ? "" : type == "busy" ? "text-red-700" : "text-green-700"}
        `}>{ text }</span>
      </div>
      <span className="text-[10px] text-gray-600">{ note }</span>
    </div>
  )
}

function BusyStatusIndicator() {
  const [ error, setError ] = useState<null | string>(null);
  const [ loading, setLoading ] = useState(true);
  const [ status, setStatus ] = useState<null | FreeBusyStatus>(null);
  
  async function _refreshStatus() {
    setLoading(true);
    
    const data = await actions.getBusyStatus({});
    if ( data.error ) {
      console.log(data.error);
      setError("Some error has occurred.")
      setLoading(false);
      setStatus(null);
      return;
    }
      
    setError(null);
    setLoading(false);
    setStatus(data.data);
  }
  
  useEffect(() => {
    _refreshStatus();
    const _interval = setInterval(_refreshStatus, 100000);

    return () => {
      clearTimeout(_interval);
    }
  }, []);
  
  if ( error ) return <span className="text-red-500 text-xs"> Widget error: { error }</span>
  
  if ( loading ) {
    return <Chip type="loading" text="Searching calendar for events" />
  }
  
  if ( status && status.status == "busy" ) {
    return <Chip 
      type="busy" 
      text="Saphal is currently busy" 
      note={status.freeAt != null ? `Will be free in ${status.freeAt?.toLocaleTimeString('en-US', DATE_FORMAT_OPTIONS)}` : ""}
      />
    }
    
    return <Chip 
    type="free" 
    text="Saphal is currently free" 
    note={status?.busyAt != null ? `Will be busy in ${status?.busyAt?.toLocaleTimeString('en-US', DATE_FORMAT_OPTIONS)}` : ""}
  />
}

export default BusyStatusIndicator;