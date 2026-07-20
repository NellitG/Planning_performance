import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, MapPin, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReferenceData } from "@/hooks/useUserManagementApi";

type SortKey = "county" | "institute" | "centre" | "subCentre";
type SortDirection = "asc" | "desc";
type Row = {
  id: string;
  county: string;
  institute: string;
  centre: string;
  subCentre: string;
};

const PAGE_SIZE = 10;
const EMPTY_VALUE = "—";

function SortButton({ label, sortKey, activeKey, direction, onSort }: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const isActive = activeKey === sortKey;

  return <button type="button" onClick={() => onSort(sortKey)} className="flex items-center gap-1 font-medium hover:text-green-700">
    {label}
    {isActive && (direction === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)}
  </button>;
}

export default function ReferenceData() {
  const { data = [], isLoading, isError, refetch } = useReferenceData();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({ key: "county", direction: "asc" });

  const rows = useMemo<Row[]>(() => data.flatMap((county) => county.institutes.flatMap((institute) => [
    ...institute.centres.flatMap((centre) => centre.subCentres.length
      ? centre.subCentres.map((subCentre) => ({
        id: `${county.id}-${institute.id}-${centre.id}-${subCentre.id}`,
        county: county.name,
        institute: institute.name,
        centre: centre.name,
        subCentre: subCentre.name,
      }))
      : [{
        id: `${county.id}-${institute.id}-${centre.id}`,
        county: county.name,
        institute: institute.name,
        centre: centre.name,
        subCentre: EMPTY_VALUE,
      }]),
    ...institute.directSubCentres.map((subCentre) => ({
      id: `${county.id}-${institute.id}-direct-${subCentre.id}`,
      county: county.name,
      institute: institute.name,
      centre: EMPTY_VALUE,
      subCentre: subCentre.name,
    })),
    ...(institute.centres.length || institute.directSubCentres.length ? [] : [{
      id: `${county.id}-${institute.id}`,
      county: county.name,
      institute: institute.name,
      centre: EMPTY_VALUE,
      subCentre: EMPTY_VALUE,
    }]),
  ])), [data]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = rows.filter((row) => !normalizedQuery || [row.county, row.institute, row.centre, row.subCentre]
      .some((value) => value.toLowerCase().includes(normalizedQuery)));
    const compare = (left: Row, right: Row) => {
      const countyComparison = left.county.localeCompare(right.county);
      if (sort.key === "county") return countyComparison || left.institute.localeCompare(right.institute) || left.centre.localeCompare(right.centre) || left.subCentre.localeCompare(right.subCentre);
      const comparison = left[sort.key].localeCompare(right[sort.key]);
      return countyComparison || comparison || left.institute.localeCompare(right.institute) || left.centre.localeCompare(right.centre) || left.subCentre.localeCompare(right.subCentre);
    };
    return matches.sort((left, right) => (sort.direction === "asc" ? 1 : -1) * compare(left, right));
  }, [query, rows, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const countySections = useMemo(() => pageRows.reduce<Array<{ county: string; rows: Row[] }>>((sections, row) => {
    const existing = sections.find((section) => section.county === row.county);
    if (existing) existing.rows.push(row);
    else sections.push({ county: row.county, rows: [row] });
    return sections;
  }, []), [pageRows]);

  const changeSort = (key: SortKey) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  if (isLoading) return <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">Loading organisational reference data…</div>;
  if (isError) return <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">Unable to load reference data. <Button variant="link" onClick={() => refetch()}>Try again</Button></div>;

  return <div className="space-y-5">
    <PageHeader title="Reference Data" description="KALRO institutes, centres and sub-centres, organised by county." actions={<Badge className="bg-green-700">{data.length} Counties</Badge>} />

    <div className="rounded-xl border bg-card p-3 shadow-sm sm:p-4">
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search county, institute, centre or sub-centre..." />
      </div>
    </div>

    {!countySections.length ? <div className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">No reference records match this search.</div> : countySections.map((section) => <section key={section.county} className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b bg-green-50 px-4 py-3 text-green-950">
        <MapPin className="h-4 w-4 text-green-700" />
        <h2 className="font-semibold">County: {section.county}</h2>
        <Badge variant="secondary" className="ml-auto">{section.rows.length} record{section.rows.length === 1 ? "" : "s"}</Badge>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><SortButton label="Institute" sortKey="institute" activeKey={sort.key} direction={sort.direction} onSort={changeSort} /></TableHead>
              <TableHead><SortButton label="Centre" sortKey="centre" activeKey={sort.key} direction={sort.direction} onSort={changeSort} /></TableHead>
              <TableHead><SortButton label="Sub-Centre" sortKey="subCentre" activeKey={sort.key} direction={sort.direction} onSort={changeSort} /></TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {section.rows.map((row) => <TableRow key={row.id}>
              <TableCell className="font-medium">{row.institute}</TableCell>
              <TableCell>{row.centre}</TableCell>
              <TableCell>{row.subCentre}</TableCell>
              {/* <TableCell className="text-right text-sm text-muted-foreground">Read-only</TableCell> */}
            </TableRow>)}
          </TableBody>
        </Table>
      </div>
    </section>)}

    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>{filteredRows.length} record{filteredRows.length === 1 ? "" : "s"}</span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button>
        <span>{currentPage} / {totalPages}</span>
        <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</Button>
      </div>
    </div>
  </div>;
}
