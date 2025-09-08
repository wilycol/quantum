export default function InfoIcon({ className = "text-sky-400" }: { className?: string }) {
  return (
    <svg 
      width="16" 
      height="16" 
      className={className} 
      viewBox="0 0 24 24" 
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm.9 6.5a.9.9 0 11-1.8 0 .9.9 0 011.8 0zM11 10h2v6h-2v-6z"/>
    </svg>
  );
}
