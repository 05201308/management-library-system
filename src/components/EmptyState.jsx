export default function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <span className="empty-mark">▤</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
