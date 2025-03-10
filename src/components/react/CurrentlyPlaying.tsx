import { actions } from "astro:actions";
import { useEffect, useState } from "react";
import Skeleton from "./common/Skeleton";

interface CurrentlyPlayingProps {
  spotifyLogo?: React.ReactNode;
}

function CurrentlyPlaying({
  spotifyLogo,
}: CurrentlyPlayingProps) {

  const [ offline, setOffline ] = useState(false);
  const [ firstLoad, setFirstLoad ] = useState(true);
  const [ playing, setPlaying ] = useState<null | SpotifyCurrentlyPlaying>(null)
  const [ isError, setIsError ] = useState(false);

  async function _updateCurrentlyPlayingData() {
    const data = await actions.getSpotifyCurrentlyPlaying();

    if ( data.error ) {
      setIsError(true);
      return;
    };

    setIsError(false);
    setFirstLoad(false);

    if ( data.data.status === "offline" ) {
      setOffline(true);
      setPlaying(null);
    } else if ( data.data.status === "playing" ) {
      setOffline(false);
      setPlaying(data.data);
    } else {
      // Getting rate Limited
      setIsError(true);
    }

  }
  
  useEffect(() => {
    _updateCurrentlyPlayingData();

    const _interval = setInterval(_updateCurrentlyPlayingData, 1000);

    return () => {
      clearInterval(_interval);
    }
  }, [])
  
  if ( isError ) {
    return <div className="text-red-500">
      Spotify API: Something went wrong.
    </div>
  }
  
  if ( firstLoad ) return <div>
    <Skeleton className="w-auto md:w-40 h-14" />
  </div>

  if ( offline ) return (
    <div className="flex items-center py-1 px-2 bg-gray-50 border-2 border-gray-300 justify-center gap-2 rounded-lg text-gray-800 font-serif text-md">
      <div className="w-4 h-4">
        { spotifyLogo }
      </div>
      <span className="text-md text-gray-600">Saphal is not connected</span>
    </div>
  )
  
  if ( playing && playing.status === "playing" ) {
    const originalName = playing.data.item.name;
    const parsedName = playing.data.item.explicit ? originalName.replace(/[^ ]/g, '*') : originalName;
    
    return (
      <div className="relative overflow-hidden py-1 px-2 bg-gray-50 border-2 border-gray-300 shadow-sm rounded-xl flex items-center gap-2">
        <div className="w-9 h-9 rounded-full border-2 border-gray-600"
          style={{
            backgroundImage: `url(${playing.data.item.album.images[0].url as string})`,
            backgroundSize: "cover",
          }}
        />
        <div className="flex flex-col text-md">
          <div className="flex gap-1 items-center">
            <div className="w-3 h-3">
              { spotifyLogo }
            </div>
            <span className="text-[9px] italic font-serif text-zinc-400">
              Currently {playing.data.is_playing ? "Listening" : "Paused on"}
            </span>
          </div>
          <span className="font-serif">{parsedName}</span>
          <span className="text-[10px] text-gray-600 italic">{playing.data.item.artists.map((a: any) => a.name).join(", ")}</span>
        </div>  

        <div
          style={{
            width: `${(playing.data.progress_ms / playing.data.item.duration_ms) * 100}%`,
          }}
          className={`bg-slate-400 h-[2px] absolute bottom-0 left-0 ${playing.data.is_playing ? "animate-pulse" : ""}`}
        />
      </div>
    );  
  }
}

export default CurrentlyPlaying;