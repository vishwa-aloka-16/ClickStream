import { Icon } from './Icon'

export function EmptyState({ icon, title, text, children }) {
  return (
    <div className="admin-empty">
      {icon && <Icon>{icon}</Icon>}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  )
}
