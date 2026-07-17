import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, FolderTree, MapPin, Search, Table2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type ReferenceCounty, useReferenceData } from "@/hooks/useUserManagementApi";

type Row = { county: string; institute: string; centre: string; subCentre: string };
type View = "tree" | "table";
const PAGE_SIZE = 10;

function Toggle({ open, onClick, children }: { open: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-green-50"><span className="text-green-700">{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>{children}</button>;
}

function Tree({ data }: { data: ReferenceCounty[] }) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(data.map((county) => `county-${county.id}`)));
  const toggle = (key: string) => setOpen((current) => { const next = new Set(current); next.has(key) ? next.delete(key) : next.add(key); return next; });
  return <div className="rounded-xl border bg-card p-3 shadow-sm sm:p-5">
    {data.map((county) => {
      const countyKey = `county-${county.id}`; return <div key={county.id} className="border-b last:border-0">
        <Toggle open={open.has(countyKey)} onClick={() => toggle(countyKey)}><MapPin className="h-4 w-4 text-green-700" /><span className="font-semibold">{county.name} County</span><Badge variant="secondary">{county.institutes.length}</Badge></Toggle>
        {open.has(countyKey) && <div className="ml-4 border-l border-green-200 pl-3 pb-2 sm:ml-6">{county.institutes.map((institute) => {
          const key = `institute-${institute.id}`; const hasChildren = institute.centres.length + institute.directSubCentres.length > 0; return <div key={institute.id} className="py-1">
            {hasChildren ? <Toggle open={open.has(key)} onClick={() => toggle(key)}><span className="font-medium">{institute.name}</span></Toggle> : <div className="px-8 py-1.5 font-medium">{institute.name}</div>}
            {hasChildren && open.has(key) && <div className="ml-4 border-l border-green-100 pl-3 sm:ml-6">
              {institute.centres.map((centre) => { const centreKey = `centre-${centre.id}`; return <div key={centre.id} className="py-1">{centre.subCentres.length ? <Toggle open={open.has(centreKey)} onClick={() => toggle(centreKey)}><span>{centre.name}</span><span className="text-xs text-muted-foreground">{centre.county}</span></Toggle> : <div className="px-8 py-1.5">{centre.name} <span className="text-xs text-muted-foreground">{centre.county}</span></div>}{open.has(centreKey) && <div className="ml-4 border-l border-dashed border-green-100 pl-4 sm:ml-6">{centre.subCentres.map((sub) => <div key={sub.id} className="py-1.5 text-sm">{sub.name} <span className="text-xs text-muted-foreground">{sub.county}</span></div>)}</div>}</div>; })}
              {institute.directSubCentres.map((sub) => <div key={sub.id} className="py-1.5 text-sm"><span className="mr-2 text-green-600">↳</span>{sub.name} <span className="text-xs text-muted-foreground">{sub.county}</span></div>)}
            </div>}
          </div>;
        })}</div>}
      </div>;
    })}
  </div>;
}

export default function ReferenceData() {
  const { data = [], isLoading, isError, refetch } = useReferenceData();
  const [view, setView] = useState<View>("tree"); const [query, setQuery] = useState(""); const [page, setPage] = useState(1); const [sortAsc, setSortAsc] = useState(true);
  const rows = useMemo<Row[]>(() => data.flatMap((county) => county.institutes.flatMap((institute) => [
    ...institute.centres.flatMap((centre) => centre.subCentres.length ? centre.subCentres.map((sub) => ({ county: county.name, institute: institute.name, centre: centre.name, subCentre: sub.name })) : [{ county: county.name, institute: institute.name, centre: centre.name, subCentre: "—" }]),
    ...institute.directSubCentres.map((sub) => ({ county: county.name, institute: institute.name, centre: "—", subCentre: sub.name })),
    ...(institute.centres.length || institute.directSubCentres.length ? [] : [{ county: county.name, institute: institute.name, centre: "—", subCentre: "—" }]),
  ])), [data]);
  const filtered = useMemo(() => rows.filter((row) => Object.values(row).some((value) => value.toLowerCase().includes(query.toLowerCase()))).sort((a, b) => (sortAsc ? 1 : -1) * a.county.localeCompare(b.county)), [rows, query, sortAsc]);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE); const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (isLoading) return <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">Loading organisational reference data…</div>;
  if (isError) return <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">Unable to load reference data. <Button variant="link" onClick={() => refetch()}>Try again</Button></div>;
  const treeData = query ? data.map((county) => ({ ...county, institutes: county.institutes.filter((institute) => [county.name, institute.name, ...institute.centres.flatMap((c) => [c.name, ...c.subCentres.map((s) => s.name)]), ...institute.directSubCentres.map((s) => s.name)].join(" ").toLowerCase().includes(query.toLowerCase())) })).filter((county) => county.institutes.length) : data;
  return <div className="space-y-5"><PageHeader title="Reference Data" description="KALRO institutes, centres and sub-centres from the approved organisational reference document." actions={<Badge className="bg-green-700">{data.length} Counties</Badge>} />
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search county, institute, centre..." /></div><div className="flex gap-2"><Button variant={view === "tree" ? "default" : "outline"} className={view === "tree" ? "bg-green-700" : ""} onClick={() => setView("tree")}><FolderTree className="h-4 w-4" /> Hierarchy</Button><Button variant={view === "table" ? "default" : "outline"} className={view === "table" ? "bg-green-700" : ""} onClick={() => setView("table")}><Table2 className="h-4 w-4" /> Table</Button></div></div>
    {view === "tree" ? <Tree data={treeData} /> : <div className="rounded-xl border bg-card shadow-sm"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead><button onClick={() => setSortAsc(!sortAsc)} className="flex items-center gap-1">County {sortAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}</button></TableHead><TableHead>Institute</TableHead><TableHead>Centre</TableHead><TableHead>Sub-Centre</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{pageRows.map((row, index) => <TableRow key={`${row.institute}-${row.centre}-${row.subCentre}-${index}`}><TableCell>{row.county}</TableCell><TableCell className="font-medium">{row.institute}</TableCell><TableCell>{row.centre}</TableCell><TableCell>{row.subCentre}</TableCell><TableCell><Button variant="ghost" size="sm" onClick={() => { setQuery(row.institute); setView("tree"); }}>View hierarchy</Button></TableCell></TableRow>)}{!pageRows.length && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No reference records match this search.</TableCell></TableRow>}</TableBody></Table></div><div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground"><span>{filtered.length} records</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button><span className="self-center">{page} / {pages}</span><Button size="sm" variant="outline" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</Button></div></div></div>}
  </div>;
}
