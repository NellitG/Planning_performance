import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReferenceData } from "@/hooks/useUserManagementApi";

const PAGE_SIZE = 10;

export default function ReferenceData() {
  const { data = [], isLoading, isError, refetch } = useReferenceData();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const institutes = useMemo(() => data
    .flatMap((group) => group.institutes)
    .map((institute) => ({
      ...institute,
      centres: [...institute.centres].sort((left, right) => left.name.localeCompare(right.name)),
    }))
    .sort((left, right) => left.name.localeCompare(right.name)), [data]);

  const filteredInstitutes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return institutes.flatMap((institute) => {
      const matchesInstitute = institute.name.toLowerCase().includes(normalizedQuery);
      const matchingCentres = institute.centres.filter((centre) =>
        centre.name.toLowerCase().includes(normalizedQuery));
      if (!normalizedQuery || matchesInstitute) return [institute];
      if (!matchingCentres.length) return [];
      return [{ ...institute, centres: matchingCentres }];
    });
  }, [institutes, query]);

  const totalCentres = institutes.reduce((total, institute) => total + institute.centres.length, 0);
  const totalPages = Math.max(1, Math.ceil(filteredInstitutes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageInstitutes = filteredInstitutes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (isLoading) return <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">Loading organisational reference data…</div>;
  if (isError) return <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">Unable to load reference data. <Button variant="link" onClick={() => refetch()}>Try again</Button></div>;

  return <div className="space-y-5">
    <PageHeader
      title="Reference Data"
      description="KALRO institutes and the centres under each institute."
      actions={<Badge className="bg-green-700">{institutes.length} Institutes · {totalCentres} Centres</Badge>}
    />

    <div className="rounded-xl border bg-card p-3 shadow-sm sm:p-4">
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setPage(1); }}
          placeholder="Search institutes or centres..."
        />
      </div>
    </div>

    {!pageInstitutes.length ? <div className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">No reference records match this search.</div> : pageInstitutes.map((institute) => <section key={institute.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b bg-green-50 px-4 py-3 text-green-950">
        <h2 className="font-semibold">{institute.name}</h2>
        <Badge variant="secondary" className="ml-auto">{institute.centres.length} Centre{institute.centres.length === 1 ? "" : "s"}</Badge>
      </div>
      {institute.centres.length ? <ul className="divide-y">
        {institute.centres.map((centre) => <li key={centre.id} className="px-4 py-3 text-sm">{centre.name}</li>)}
      </ul> : <p className="px-4 py-3 text-sm text-muted-foreground">No centres listed.</p>}
    </section>)}

    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>{filteredInstitutes.length} Institute{filteredInstitutes.length === 1 ? "" : "s"}</span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button>
        <span>{currentPage} / {totalPages}</span>
        <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</Button>
      </div>
    </div>
  </div>;
}
