import { LucideProps } from "lucide-react";

export const HomeIcon = (props: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-all duration-300 hover:-translate-y-1 hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
    {...props}
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" className="fill-primary/20 stroke-primary transition-all duration-300 hover:fill-primary/40" />
    <polyline points="9 22 9 12 15 12 15 22" className="stroke-primary" />
  </svg>
);

export const ActivityIcon = (props: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-all duration-300 hover:scale-110 hover:animate-[bounce_0.6s_ease-in-out]"
    {...props}
  >
    <rect x="2" y="6" width="20" height="12" rx="2" className="fill-accent/20 stroke-accent transition-all duration-300 hover:fill-accent/40" />
    <circle cx="8" cy="12" r="2" className="fill-accent stroke-accent" />
    <circle cx="16" cy="12" r="2" className="fill-accent stroke-accent" />
    <path d="M8 10V8m8 2V8" className="stroke-accent" />
  </svg>
);

export const FriendsIcon = (props: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-all duration-300 hover:scale-125"
    {...props}
  >
    <circle cx="9" cy="7" r="4" className="fill-secondary/20 stroke-secondary transition-all duration-300 hover:fill-secondary/40" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" className="stroke-secondary" />
    <circle cx="16" cy="8" r="3" className="fill-secondary/30 stroke-secondary transition-all duration-300 hover:fill-secondary/50" />
    <path d="M21 21v-2a3 3 0 0 0-3-3" className="stroke-secondary" />
  </svg>
);

export const ChatIcon = (props: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-all duration-300 hover:rotate-[-5deg] hover:drop-shadow-[0_0_8px_rgb(59,130,246,0.6)]"
    {...props}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" className="fill-blue-500/20 stroke-blue-500 transition-all duration-300 hover:fill-blue-500/40" />
    <circle cx="9" cy="10" r="1" className="fill-blue-500" />
    <circle cx="12" cy="10" r="1" className="fill-blue-500" />
    <circle cx="15" cy="10" r="1" className="fill-blue-500" />
  </svg>
);

export const ToolsIcon = (props: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-all duration-500 hover:rotate-[15deg]"
    {...props}
  >
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" className="fill-orange-500/20 stroke-orange-500 transition-all duration-500 hover:fill-orange-500/40" />
  </svg>
);

export const HelpIcon = (props: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-all duration-300 hover:animate-pulse hover:drop-shadow-[0_0_10px_rgb(34,197,94,0.7)]"
    {...props}
  >
    <circle cx="12" cy="12" r="10" className="fill-green-500/20 stroke-green-500 transition-all duration-300 hover:fill-green-500/40" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" className="stroke-green-500" />
    <circle cx="12" cy="17" r="0.5" className="fill-green-500 stroke-green-500" strokeWidth="3" />
  </svg>
);

export const PhilosophyIcon = (props: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-all duration-300 hover:rotate-[-8deg] hover:scale-110"
    {...props}
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" className="stroke-purple-500" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" className="fill-purple-500/20 stroke-purple-500 transition-all duration-300 hover:fill-purple-500/40" />
    <path d="M10 6h6M10 10h6M10 14h4" className="stroke-purple-500" />
  </svg>
);

export const ProfileIcon = (props: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_12px_rgb(236,72,153,0.7)]"
    {...props}
  >
    <circle cx="12" cy="8" r="5" className="fill-pink-500/20 stroke-pink-500 transition-all duration-300 hover:fill-pink-500/40" />
    <path d="M20 21a8 8 0 1 0-16 0" className="stroke-pink-500" />
    <circle cx="12" cy="8" r="2" className="fill-pink-500" />
  </svg>
);

export const SettingsIcon = (props: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-all duration-500 hover:rotate-90"
    {...props}
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" className="fill-cyan-500/20 stroke-cyan-500 transition-all duration-500 hover:fill-cyan-500/40" />
    <circle cx="12" cy="12" r="3" className="fill-cyan-500/40 stroke-cyan-500" />
  </svg>
);

export const CreateIcon = (props: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-all duration-300 hover:scale-125 hover:rotate-90 hover:drop-shadow-[0_0_10px_hsl(var(--primary)/0.8)]"
    {...props}
  >
    <circle cx="12" cy="12" r="10" className="fill-primary/20 stroke-primary transition-all duration-300 hover:fill-primary/40" />
    <line x1="12" y1="8" x2="12" y2="16" className="stroke-primary" strokeWidth="3" />
    <line x1="8" y1="12" x2="16" y2="12" className="stroke-primary" strokeWidth="3" />
  </svg>
);
