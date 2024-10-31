import { useEffect, useState } from "react";
import { actions } from "astro:actions";

import Spinner from "./Spinner";
import Skeleton from "./common/Skeleton";

const PROGRESS_BAR_TOTAL_LENGTH = 20;
const TOP_LANGUAGES = 6;

function ProgressBar({ percentage, color } : {
  percentage: number,
  color: string,
}) {
  const filledBlocks = Math.round((percentage / 100) * PROGRESS_BAR_TOTAL_LENGTH);
  const emptyBlocks = PROGRESS_BAR_TOTAL_LENGTH - filledBlocks;
  
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

  async function _refreshLanguages() {
    const data = await actions.getTopLanguages({
      top: 5,
    });
    if (data == undefined)
      throw new Error("Data is undefined");

    setLanguages(data.data!);
  }
  
  useEffect(() => {
    _refreshLanguages();
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
      <div className="flex text-lg gap-2 items-center font-semibold">
        Most Used Languages on GitHub 
        <div className="w-6 h-6">
          { githubLogo }
        </div>
      </div>
      <div className="grid grid-cols-2 font-serif">
        {
          languages && languages.slice(0,TOP_LANGUAGES).map(([language, percentage, color]) => {
            return <>
              <span>{`${language.padEnd(30)}: `}</span>
              <ProgressBar key={language} percentage={parseFloat(percentage)} color={color}/>
            </>
          })
        }
      </div>
    </div>
  ) 
}

export default TopLanguages;