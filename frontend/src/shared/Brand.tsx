import { Files } from 'lucide-react';

interface BrandProps {
  inverse?: boolean;
}

export function Brand({ inverse = false }: BrandProps) {
  return (
    <div
      className={`brand${inverse ? ' brand--inverse' : ''}`}
      aria-label="Jus Digital"
    >
      <span className="brand__mark" aria-hidden="true">
        <Files size={19} strokeWidth={2} />
      </span>
      <span className="brand__name">Jus Digital</span>
    </div>
  );
}
