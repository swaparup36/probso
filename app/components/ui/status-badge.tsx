export function StatusBadge({
  color,
  text,
}: {
  color: 'purple' | 'green' | 'red';
  text: string;
}) {
  const colors = {
    purple: 'bg-purple-100 text-purple-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
  };

  return (
    <div
      className={`inline-flex items-center justify-center px-5 py-2 rounded-full font-semibold ${colors[color]}`}
    >
      {text}
    </div>
  );
}