export default function Tag({ label, color }) {
  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded-md text-white ${color}`}
    >
      {label}
    </span>
  );
}
