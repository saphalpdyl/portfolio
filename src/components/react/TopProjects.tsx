import { useEffect, useState } from "react";

import { actions } from "astro:actions";

interface Repository {
  description: string,
  name: string,
  nameWithOwner: string,
}

function TopProjects() {
  const [ projects, setProjects ] = useState<null | Repository[]>(null);

  async function _refreshProjects() {
    const data = await actions.getTopRepositories({ top: 3 });
    setProjects(data.data);
  }
  
  useEffect(() => {
    _refreshProjects();
  }, [])
  
  return (
    <div>Top Projects</div>
  )
}

export default TopProjects;