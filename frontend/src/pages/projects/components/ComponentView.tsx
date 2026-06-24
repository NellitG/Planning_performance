import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useComponents, useObjectives, useStrategies } from "@/hooks/useProjectsApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ComponentView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: components = [], isLoading } = useComponents();
  const { data: allObjectives = [] } = useObjectives();
  const { data: allStrategies = [] } = useStrategies();

  const component = components.find((c) => c.id === id) ?? null;
  const objectives = allObjectives.filter((o) => o.componentId === id);
  const strategies = allStrategies.filter((s) => s.componentId === id);

  useEffect(() => {
    if (!isLoading && components.length && !component) {
      toast.error("Key Result Area not found");
      navigate("/projects/components");
    }
  }, [isLoading, components, component, navigate]);

  if (!component) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={component.title}
        description={`Key Result Area · Created ${component.createdAt}`}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/projects/components"><ArrowLeft className="h-4 w-4" /> Back</Link>
            </Button>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to={`/projects/components/${id}/edit`}><Pencil className="h-4 w-4" /> Edit</Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Strategic Objectives</p>
          <p className="text-3xl font-bold text-foreground">{objectives.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Strategies</p>
          <p className="text-3xl font-bold text-foreground">{strategies.length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Strategic Objectives under this KRA</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Strategic Objective</TableHead>
              <TableHead>Date Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {objectives.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                  No strategic objectives linked to this KRA.
                </TableCell>
              </TableRow>
            )}
            {objectives.map((o, i) => (
              <TableRow key={o.id}>
                <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                <TableCell className="font-medium">{o.text}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{o.createdAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
