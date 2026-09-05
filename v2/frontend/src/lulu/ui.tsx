export function Brand() {
  return (
    <div className="lulu-brand">
      <strong>LULU</strong>
      <span>la nantaise</span>
    </div>
  );
}

export function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="lulu-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="lulu-empty">
      <span>✳</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
