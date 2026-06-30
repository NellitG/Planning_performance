export interface ImplementationUnitData {
  headquarters: boolean;
  directorate: string;
  institute: boolean;
  instituteName: string;
  centre: string;
  subCentre: string;
  kalroSeeds: boolean;
}

export interface LocationEntry {
  county: string;
  subCounty: string;
  ward: string;
}

export interface FundingSourceEntry {
  sourceName: string;
  partner: string;
  type: string;
  amount: string;
  disbursed: string;
  utilized: string;
}

export interface DocumentEntry {
  title: string;
  docType: string;
  description: string;
  file: File | null;
}

export interface WizardData {
  title: string;
  coordinator: string;
  projectType: string;
  status: string;
  scale: string;
  description: string;

  implementationUnits: ImplementationUnitData;
  valueChains: string[];

  selectedOutputIds: string[];

  startDate: string;
  expectedEndDate: string;
  completionRate: string;
  expectedBudget: string;
  disbursedAmount: string;
  utilizedAmount: string;

  background: string;
  objectives: string;
  expectedOutcomes: string;
  sustainability: string;
  collaborators: string;

  totalBeneficiaries: string;
  women: string;
  youth: string;
  vmgs: string;
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
  scale: "",
  description: "",

  implementationUnits: {
    headquarters: false,
    directorate: "",
    institute: false,
    instituteName: "",
    centre: "",
    subCentre: "",
    kalroSeeds: false,
  },
  valueChains: [],

  selectedOutputIds: [],

  startDate: "",
  expectedEndDate: "",
  completionRate: "",
  expectedBudget: "",
  disbursedAmount: "",
  utilizedAmount: "",

  background: "",
  objectives: "",
  expectedOutcomes: "",
  sustainability: "",
  collaborators: "",

  totalBeneficiaries: "",
  women: "",
  youth: "",
  vmgs: "",
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
}
