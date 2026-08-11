import { Home, Library, Search } from 'lucide-react';

export type PageName = 'home' | 'search' | 'library';

type BottomNavProps = { page: PageName; onChange: (page: PageName) => void };

export function BottomNav({ page, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {([
        ['home', Home, 'Home'],
        ['search', Search, 'Search'],
        ['library', Library, 'Library']
      ] as const).map(([key, Icon, label]) => (
        <button key={key} className={`nav-item ${page === key ? 'is-active' : ''}`} onClick={() => onChange(key)} aria-current={page === key ? 'page' : undefined}>
          <Icon size={24} strokeWidth={page === key ? 2.8 : 2} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
