import { useEffect, useState } from "react";
import { actions } from "astro:actions";

import Spinner from "./Spinner";
import Skeleton from "./common/Skeleton";

const PROGRESS_BAR_TOTAL_LENGTH = 20;
const PROGRESS_BAR_SMALL_TOTAL_LENGTH = 10;
const TOP_LANGUAGES = 6;

function ProgressBar({ percentage, color, progressBarLength } : {
  percentage: number,
  color: string,
  progressBarLength: number,
}) {
  const filledBlocks = Math.round((percentage / 100) * progressBarLength);
  const emptyBlocks = progressBarLength - filledBlocks;
  
  return (
    <div 
      style={{
        color,
      }}
      className="font-mono" 
    >
      [{'█'.repeat(filledBlocks)}
      {'░'.repeat(emptyBlocks)}]
      <span className="font-serif italic text-gray-500">{percentage.toFixed(2)}%</span>
    </div>
  );
}

function TopLanguages({ githubLogo }: {
  githubLogo?: React.ReactNode,
}) {
  const [languages, setLanguages] = useState<null | string[][]>(null);
  const [progressBarLength, setProgressBarLength] = useState(PROGRESS_BAR_TOTAL_LENGTH);

  async function _refreshLanguages() {
    const data = await actions.getTopLanguages({
      top: 5,
    });
    if (data == undefined)
      throw new Error("Data is undefined");

    setLanguages(data.data!);
  }
  
  function _recalculateProgressBarLength() {
    if ( window.innerWidth < 750 ) setProgressBarLength(PROGRESS_BAR_SMALL_TOTAL_LENGTH);
    else setProgressBarLength(PROGRESS_BAR_TOTAL_LENGTH);
  }
  
  useEffect(() => {
    _refreshLanguages();
    _recalculateProgressBarLength();

    window.addEventListener('resize', _recalculateProgressBarLength);

    return () => {
      window.removeEventListener('resize', _recalculateProgressBarLength);
    }
  }, []);

  if (!languages) return (
    <div className="flex flex-col gap-2">
      <Skeleton className="w-80 h-8" />
      <Skeleton className="w-full h-6" />
      <Skeleton className="w-full h-6" />
      <Skeleton className="w-full h-6" />
      <Skeleton className="w-full h-6" />
      <Skeleton className="w-full h-6" />
    </div>
  )

  return (
    <div className="flex flex-col font-serif gap-2">
      <div className="flex text-lg gap-2 items-center font-semibold underline">
        <div className="w-6 h-6">
          { githubLogo }
        </div>
        Most Used Languages on GitHub 
      </div>
      <div className="grid grid-cols-2 font-serif">
        {
          languages && languages.slice(0,TOP_LANGUAGES).map(([language, percentage, color]) => {
            return <>
              <span>{`${language.padEnd(30)}: `}</span>
              <ProgressBar key={language} percentage={parseFloat(percentage)} color={color} progressBarLength={progressBarLength}/>
            </>
          })
        }
      </div>
    </div>
  ) 
}

export default TopLanguages;