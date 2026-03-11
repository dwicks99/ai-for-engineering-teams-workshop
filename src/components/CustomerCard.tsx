import { Customer } from '../data/mock-customers';

interface CustomerCardProps {
  customer: Customer;
}

function getHealthColor(score: number): string {
  if (score <= 30) return 'bg-red-500';
  if (score <= 70) return 'bg-yellow-400';
  return 'bg-green-500';
}

function getHealthLabel(score: number): string {
  if (score <= 30) return 'Poor';
  if (score <= 70) return 'Moderate';
  return 'Good';
}

export default function CustomerCard({ customer }: CustomerCardProps) {
  const { name, company, healthScore, domains } = customer;
  const hasDomains = domains && domains.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 w-full">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{name}</h3>
          <p className="text-sm text-gray-500 truncate">{company}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${getHealthColor(healthScore)}`} />
          <span className="text-sm font-medium text-gray-700">{healthScore}</span>
          <span className="text-xs text-gray-400">{getHealthLabel(healthScore)}</span>
        </div>
      </div>

      {hasDomains && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {domains!.length > 1 && (
            <p className="text-xs text-gray-400 mb-1">{domains!.length} domains</p>
          )}
          <ul className="space-y-0.5">
            {domains!.map((domain) => (
              <li key={domain} className="text-xs text-gray-600 font-mono truncate">
                {domain}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
