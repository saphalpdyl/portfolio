import { useEffect, useState } from "react";

import { actions } from "astro:actions";
import { Skeleton } from "@saphal/shared";
import SectionTitle from "../astro/SectionTitle.astro";

const IGNORE_REPOS_FOR_PROJECT_LANGUAGES = [
  "saphalpdyl"
]

interface Repository {
  description: string;
  name: string;
  nameWithOwner: string;
  url: string;

  // README data
  masterReadme?: {
    text: string
  }

  mainReadme?: {
    text: string
  }
}

type ProjectCardProps = {
  project: Repository,
  className?: string,
}

function ProjectCard({ project, className }: ProjectCardProps) {
  let readmeData = !project.masterReadme ? !project.mainReadme ? null : project.mainReadme : project.masterReadme;

  let languagesUsedSrc = "";
  if (readmeData && !IGNORE_REPOS_FOR_PROJECT_LANGUAGES.includes(project.name)) {
    // I usually have line in my README.md that shows the langauges I have used
    // [![Tech Stack](https://skillicons.dev/icons?i=go)]()
    // I am searching for this line

    const skillIconsLine = readmeData.text.split("\n").find(line => line.match("skillicons"))
    const pattern = /\((https?:\/\/[^\)]+)\)/;

    const match = skillIconsLine?.match(pattern);
    if (!match) {
      readmeData = null; // No match was found
    } else {
      languagesUsedSrc = match[1];
    }
  } 
  
  return <div className={`flex flex-col px-4 py-2 border-[1px] border-gray-400 rounded-lg min-h-20 ${className}`}>
    <div className="flex justify-between flex-wrap gap-y-4 ">
      <span className="text-md font-semibold text-blue-500">{ project.name }</span>
      {
        readmeData && 
        !IGNORE_REPOS_FOR_PROJECT_LANGUAGES.includes(project.name) && 
        <img src={languagesUsedSrc} alt="" className="lg:h-5 2xl:h-6 h-8" />
      }
    </div>
    <a target="_blank" href={project.url} className="text-[11px] text-gray-800 underline cursor-pointer hover:text-black">{ project.nameWithOwner }</a>
    <p className="text-md text-gray-600 mt-2 font-serif line-clamp-2">{ project.description }</p>
  </div>
}

type TopProjectsProps = {
  projectsLogo?: React.ReactNode;
}

function TopProjects({ projectsLogo }: TopProjectsProps) {
  const [ projects, setProjects ] = useState<null | Repository[]>(null);

  async function _refreshProjects() {
    const data = await actions.getTopRepositories({ top: 6 });
    setProjects(data.data);
  }
  
  useEffect(() => {
    _refreshProjects();
  }, [])

  if ( !projects ) return (
    <div className="flex flex-col gap-2">
      <Skeleton className="w-32 h-8" />
      <Skeleton className="w-full h-20" />
      <Skeleton className="w-full h-20" />
      <Skeleton className="w-full h-20" />
    </div>
  )
  
  return (
    <div className="flex flex-col">
      <p className="font-serif text-md mb-2">The projects that I have been publicly involved in recently.</p>
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
        {
          projects.slice(0,3).map(proj => <ProjectCard project={proj} />)
        }
        {
          projects.slice(3,6).map(proj => <ProjectCard project={proj} className="2xl:block hidden" />)
        }
      </div>
    </div>
  )
}

export default TopProjects;