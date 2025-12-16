import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Placeholder } from "@/pages/Index";

interface PlaceholdersSidebarProps {
  placeholders: Placeholder[];
  onPlaceholderChange: (id: string, value: string) => void;
}

export const PlaceholdersSidebar = ({
  placeholders,
  onPlaceholderChange,
}: PlaceholdersSidebarProps) => {
  if (placeholders.length === 0) {
    return (
      <Card className="w-80 border-r border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Editable Fields</h2>
        <p className="text-sm text-muted-foreground">
          No editable placeholders found in this document.
        </p>
      </Card>
    );
  }

  return (
    <Card className="w-80 border-r border-border bg-card">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Editable Fields</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Fill in the values below
        </p>
      </div>
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4 space-y-4">
          {placeholders.map((placeholder, index) => (
            <div key={placeholder.id} className="space-y-2">
              <Label htmlFor={placeholder.id} className="text-sm font-medium">
                #{index + 1} {placeholder.key}
              </Label>
              <Input
                id={placeholder.id}
                value={placeholder.value}
                onChange={(e) => onPlaceholderChange(placeholder.id, e.target.value)}
                placeholder={`Enter ${placeholder.key}`}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
