interface SkeletonProps {
  className: string;
  children?: React.ReactNode;
};

function Skeleton(props: SkeletonProps) {
  
  return <div className={`rounded-lg bg-neutral-100 animate-pulse ${props.className}`}>
    { props.children }
  </div>
}

export default Skeleton;