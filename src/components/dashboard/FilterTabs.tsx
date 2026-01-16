import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FilterTabsProps {
  value: string;
  onChange: (value: string) => void;
  counts: {
    all: number;
    occupied: number;
    vacant: number;
    cleaning: number;
    maintenance: number;
  };
}

export function FilterTabs({ value, onChange, counts }: FilterTabsProps) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList className="bg-muted/50 p-1">
        <TabsTrigger value="all" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
          All <span className="ml-1.5 text-muted-foreground">({counts.all})</span>
        </TabsTrigger>
        <TabsTrigger value="occupied" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
          Occupied <span className="ml-1.5 text-muted-foreground">({counts.occupied})</span>
        </TabsTrigger>
        <TabsTrigger value="vacant" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
          Vacant <span className="ml-1.5 text-muted-foreground">({counts.vacant})</span>
        </TabsTrigger>
        <TabsTrigger value="cleaning" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
          Cleaning <span className="ml-1.5 text-muted-foreground">({counts.cleaning})</span>
        </TabsTrigger>
        <TabsTrigger value="maintenance" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
          Maintenance <span className="ml-1.5 text-muted-foreground">({counts.maintenance})</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
