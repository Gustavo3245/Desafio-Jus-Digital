interface SpinnerProps {
  label: string;
}

export function Spinner({ label }: SpinnerProps) {
  return <span className="spinner" role="img" aria-label={label} />;
}
