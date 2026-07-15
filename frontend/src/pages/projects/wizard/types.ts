export interface ImplementationUnitData {
  headquarters: boolean;
  coordination: string;
  coordinationOther: string;
  institute: boolean;
  instituteName: string;
  centre: string;
  subCentre: string;
}

export interface LocationEntry {
  county: string;
  subCounty: string;
  ward: string;
}

export interface FundingSourceEntry {
  sourceName: string;
  fundingAgency: string;
  fundingAgencyOther: string;
  type: string;
  amount: string;
  disbursed: string;
  utilized: string;
}

export interface DocumentEntry {
  id?: string;
  title: string;
  docType: string;
  description: string;
  files: File[];
}

export interface WizardData {
  id?: string;
  title: string;
  coordinator: string;
  projectType: string;
  status: string;
  description: string;

  implementationUnits: ImplementationUnitData;
  valueChains: string[];

  selectedKeyActivityIds: string[];
  selectedOutputIds: string[];
  selectedOutputIndicatorIds: string[];

  startDate: string;
  expectedEndDate: string;
  budget: string;

  background: string;
  objectives: string;
  expectedOutputs: string;
  collaborators: string;

  totalBeneficiaries: string;
  women: string;
  men: string;
  youth: string;
  pwds: string;

  locations: LocationEntry[];

  fundingSources: FundingSourceEntry[];

  documents: DocumentEntry[];
}

export const INITIAL_WIZARD_DATA: WizardData = {
  title: "",
  coordinator: "",
  projectType: "",
  status: "Not Started",
  description: "",

  implementationUnits: {
    headquarters: false,
    coordination: "",
    coordinationOther: "",
    institute: false,
    instituteName: "",
    centre: "",
    subCentre: "",
  },
  valueChains: [],

  selectedKeyActivityIds: [],
  selectedOutputIds: [],
  selectedOutputIndicatorIds: [],

  startDate: "",
  expectedEndDate: "",
  budget: "",

  background: "",
  objectives: "",
  expectedOutputs: "",
  collaborators: "",

  totalBeneficiaries: "",
  women: "",
  men: "",
  youth: "",
  pwds: "",

  locations: [],

  fundingSources: [],

  documents: [],
};

export interface StepProps {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving?: boolean;
}
