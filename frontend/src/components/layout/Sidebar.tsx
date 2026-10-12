
import type { PageName } from '../../App'

interface SidebarProps {
  currentPage: PageName
  onNavigate: (page: PageName) => void
}

const menuItems: { label: string; page: PageName; icon: string }[] = [
  { label: 'Início', page: 'home', icon: '⌂' },
  { label: 'Alunos', page: 'students', icon: '♧' },
  { label: 'Professores', page: 'teachers', icon: '♙' },
  { label: 'Checklist', page: 'checklist', icon: '☑' },
  { label: 'Dashboard', page: 'dashboard', icon: '▦' },
]

function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">CK</div>
        <div>
          <h1>Código Kid</h1>
          <p>Gestão escolar</p>
        </div>
      </div>

      <nav aria-label="Menu principal">
        <span className="menu-label">MENU PRINCIPAL</span>

        {menuItems.map((item) => (
          <button
            key={item.page}
            type="button"
            className={`menu-item ${
              currentPage === item.page ? 'active' : ''
            }`}
            onClick={() => onNavigate(item.page)}
          >
            <span className="menu-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <footer className="sidebar-footer">
        <span className="status-dot" />
        Sistema Código Kid
      </footer>
    </aside>
  )
}

export default Sidebar
