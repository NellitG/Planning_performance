import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PagePlaceholderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export default function PagePlaceholder({ title, description, children }: PagePlaceholderProps) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {children ?? "This module is part of the NAPMIS suite and will be wired up shortly."}
        </CardContent>
      </Card>
    </>
  );
}
