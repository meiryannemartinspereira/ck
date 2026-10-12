
import type { PageName } from '../App'

interface HomePageProps {
  onNavigate: (page: PageName) => void
}

const shortcuts: {
  title: string
  description: string
  page: PageName
  icon: string
  color: string
}[] = [
  {
    title: 'Alunos',
    description: 'Gerencie os alunos cadastrados.',
    page: 'students',
    icon: '♧',
    color: 'blue',
  },
  {
    title: 'Professores',
    description: 'Consulte os professores e horários.',
    page: 'teachers',
    icon: '♙',
    color: 'green',
  },
  {
    title: 'Checklist',
    description: 'Acompanhe as atividades das turmas.',
    page: 'checklist',
    icon: '☑',
    color: 'red',
  },
  {
    title: 'Dashboard',
    description: 'Visualize os checklists da turma.',
    page: 'dashboard',
    icon: '▦',
    color: 'yellow',
  },
]

function HomePage({ onNavigate }: HomePageProps) {
  return (
    <section className="home-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">CÓDIGO KID · CACHOEIRINHA</span>
          <h2>Olá! Seja bem-vinda 👋</h2>
          <p>Vamos organizar mais um dia de aprendizado?</p>
        </div>
      </header>

      <section className="welcome-banner">
        <div className="welcome-content">
          <span className="welcome-tag">GESTÃO ESCOLAR</span>
          <h3>Aprender, acompanhar e evoluir.</h3>
          <p>
            Acesse as áreas do sistema para organizar alunos,
            professores e checklists das aulas.
          </p>
        </div>
        <div className="welcome-decoration" aria-hidden="true">
          <span>CK</span>
        </div>
      </section>

      <section className="shortcuts-section">
        <div className="section-heading">
          <div>
            <h3>Acesso rápido</h3>
            <p>O que você deseja acessar?</p>
          </div>
        </div>

        <div className="shortcut-grid">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.page}
              type="button"
              className="shortcut-card"
              onClick={() => onNavigate(shortcut.page)}
            >
              <span className={`shortcut-icon ${shortcut.color}`}>
                {shortcut.icon}
              </span>
              <span className="shortcut-title">{shortcut.title}</span>
              <span className="shortcut-description">
                {shortcut.description}
              </span>
              <span className="shortcut-arrow" aria-hidden="true">
                →
              </span>
            </button>
          ))}
        </div>
      </section>
    </section>
  )
}

export default HomePage
