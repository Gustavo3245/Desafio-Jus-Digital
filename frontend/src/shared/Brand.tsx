import { FileText } from 'lucide-react';

interface BrandProps {
  compact?: boolean;
  inverse?: boolean;
}

export function Brand({ compact = false, inverse = false }: BrandProps) {
  return (
    <div
      className={`brand${compact ? ' brand--compact' : ''}${inverse ? ' brand--inverse' : ''}`}
      aria-label="JusDigital"
    >
      <span className="brand__mark" aria-hidden="true">
        <FileText size={20} strokeWidth={2.2} />
      </span>
      <span className="brand__name">JusDigital</span>
    </div>
  );
}
