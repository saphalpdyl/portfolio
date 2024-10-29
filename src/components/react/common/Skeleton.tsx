interface SkeletonProps {
  className: string;
};

function Skeleton(props: SkeletonProps) {
  
  return <div className={`rounded-lg bg-neutral-100 animate-pulse ${props.className}`}></div>
}

export default Skeleton;