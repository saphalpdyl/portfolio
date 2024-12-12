import { useEffect, useState } from "react";

import { actions } from "astro:actions";
import Spinner from "./Spinner";
import Skeleton from "./common/Skeleton";

interface Repository {
  description: string;
  name: string;
  nameWithOwner: string;
  url: string;
}

type ProjectCardProps = {
  project: Repository,
}

function ProjectCard({ project }: ProjectCardProps) {
  return <div className="flex flex-col px-4 py-2 border-[1px] border-gray-400 rounded-lg min-h-20">
    <div>
      <span className="text-md font-semibold text-blue-500">{ project.name }</span>
    </div>
    <a target="_blank" href={project.url} className="text-[11px] text-gray-800 underline cursor-pointer hover:text-black">{ project.nameWithOwner }</a>
    <p className="text-xs text-gray-600 mt-2">{ project.description }</p>
  </div>
}

type TopProjectsProps = {
  projectsLogo?: React.ReactNode;
}

function TopProjects({ projectsLogo }: TopProjectsProps) {
  const [ projects, setProjects ] = useState<null | Repository[]>(null);

  async function _refreshProjects() {
    const data = await actions.getTopRepositories({ top: 3 });
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
    <div className="flex flex-col gap-2">
      <span className="flex gap-2 font-serif font-semibold text-lg underline">
        <div className="w-6 h-6">
          { projectsLogo }
        </div>
        Top projects
      </span>
      <div className="flex flex-col gap-4">
        {
          projects.map(proj => <ProjectCard project={proj} />)
        }
      </div>
    </div>
  )
}

export default TopProjects;