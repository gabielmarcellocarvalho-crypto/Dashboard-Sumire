export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="page-title" style={{ marginBottom: 28 }}>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
