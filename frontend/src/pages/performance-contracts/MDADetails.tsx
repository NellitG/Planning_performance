
import PagePlaceholder from "@/components/PagePlaceholder";

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PCFormRow, PCReadonlyInput, PCInput, PCSaveButton } from "@/components/pc/PCFormRow";


export default function MDADetails() {
  // const [mdaName] = useState("Kenya Agricultural and Livestock Research Organization");
  // const [contractPeriod] = useState("2025/2026");
  // const [address, setAddress] = useState("P.O. Box 57811-00200, Nairobi");
  // const [telephone, setTelephone] = useState("+254 20 4183301");
  // const [email, setEmail] = useState("dg@kalro.org");
  // const [website, setWebsite] = useState("www.kalro.org");

  return (
    <div className="max-w-4xl">
   <PagePlaceholder title="MDA Details - SPA" description="Ministry / Department / Agency profile information." />;
      <h1 className="mb-6 text-xl font-bold text-emerald-800">MDA Details - SPA</h1>

      <div className="mb-6 overflow-hidden rounded border border-gray-200 bg-white">
        <PCFormRow label="MDA Name:">
          <PCReadonlyInput value="MDA DEtails 3 - SPA" />
        </PCFormRow>
        {/*<PCFormRow label="MDA Name:">
          <PCReadonlyInput value={mdaName} />
        </PCFormRow>
        <PCFormRow label="Contract Period:">
          <PCReadonlyInput value={contractPeriod} />
        </PCFormRow>
        <PCFormRow label="MDA Address *" required>
          <PCInput value={address} onChange={(e) => setAddress(e.target.value)} />
        </PCFormRow>
        <PCFormRow label="Telephone *" required>
          <PCInput value={telephone} onChange={(e) => setTelephone(e.target.value)} />
        </PCFormRow>
        <PCFormRow label="Email Address *" required>
          <PCInput value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </PCFormRow>
        <PCFormRow label="Website">
          <PCInput value={website} onChange={(e) => setWebsite(e.target.value)} />
        </PCFormRow>*/}
      </div>

      <PCSaveButton />
    </div>
  );
}
