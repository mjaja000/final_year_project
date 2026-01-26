import { MapPin, ArrowRight } from 'lucide-react';
import { Route } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface RouteCardProps {
  route: Route;
  selected?: boolean;
  onSelect: (route: Route) => void;
}

const RouteCard = ({ route, selected, onSelect }: RouteCardProps) => {
  return (
    <button
      onClick={() => onSelect(route)}
      className={cn(
        'route-card w-full text-left',
        selected && 'selected'
      )}
      aria-pressed={selected}
      aria-label={`Select ${route.name} from ${route.from} to ${route.to}, fare ${route.fare} shillings`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-sm font-semibold">
              {route.name}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{route.from}</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
            <span className="truncate">{route.to}</span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-foreground">
            KES {route.fare}
          </p>
          <p className="text-xs text-muted-foreground">
            {route.vehicles.length} vehicles
          </p>
        </div>
      </div>

      {selected && (
        <div className="mt-3 pt-3 border-t border-border animate-fade-in">
          <p className="text-xs text-muted-foreground mb-1">Available vehicles:</p>
          <div className="flex flex-wrap gap-1">
            {route.vehicles.map((vehicle) => (
              <span
                key={vehicle}
                className="inline-block px-2 py-0.5 bg-secondary rounded text-xs font-medium text-secondary-foreground"
              >
                {vehicle}
              </span>
            ))}
          </div>
        </div>
      )}
    </button>
  );
};

export default RouteCard;
