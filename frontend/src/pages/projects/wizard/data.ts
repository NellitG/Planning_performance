export const PROJECT_TYPES = [
  "Research and Development",
  "Infrastructure",
  "Corporate",
  "Other",
];

export const PROJECT_STATUSES_WIZARD = [
  "Not Started",
  "Ongoing",
  "Completed",
  "Suspended",
  "Terminated"
];

export const PROJECT_COORDINATION_OPTIONS = [
  "All directorates",
  "NRM",
  "Economic",
  "Crop/livestock",
  "DG's Office"
];

export const KALRO_INSTITUTES = [
  "National Agricultural Research Laboratories (NARL)",
  "National Dryland Research Institute (NDRI) – Katumani",
  "Food Crops Research Centre – Kakamega",
  "National Animal Husbandry Research Centre – Naivasha",
  "Kenya Animal Genetics Resource Centre (KAGRC)",
  "National Crops Research Centre – Mwea",
  "Coast Agricultural Research Station – Mtwapa",
  "National Arid and Semi-Arid Lands Research Station – Marigat",
  "National Food Technology Research Centre – Uyole",
  "Tea Research Institute",
  "Coffee Research Institute",
  "National Potato Research Centre – Tigoni",
  "Semi-Arid Research Centre – Perkerra",
];

export const KALRO_CENTRES: Record<string, string[]> = {
  "National Agricultural Research Laboratories (NARL)": [
    "Plant Pathology",
    "Agronomy",
    "Soil Science",
    "Biotechnology",
  ],
  "Food Crops Research Centre – Kakamega": [
    "Maize Research",
    "Legume Research",
    "Crop Protection",
  ],
};

export const KALRO_SUB_CENTRES: Record<string, string[]> = {
  "Plant Pathology": ["Bacteriology Unit", "Mycology Unit", "Virology Unit"],
  "Agronomy": ["Crop Management Unit", "Fertilizer Unit"],
  "Maize Research": ["Breeding Unit", "Agronomy Unit"],
  "Legume Research": ["Bean Unit", "Soybean Unit"],
  "Dairy Research": ["Genetics Unit", "Nutrition Unit"],
};

export const FUNDING_AGENCIES = [
  "USAID", "World Bank", "African Development Bank", "Bill & Melinda Gates Foundation",
  "FAO", "IFAD", "EU", "GIZ", "JICA", "DFID / FCDO", "Government of Kenya",
  "CGIAR", "CIMMYT", "ICRISAT", "CIP", "IITA", "Other",
];

export const QUARTER_OPTIONS = ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"];
export const FINANCIAL_YEAR_OPTIONS = ["2023/2024", "2024/2025", "2025/2026", "2026/2027", "2027/2028"];
export const FUNDING_TYPES = ["Grant", "Loan", "Government Allocation", "Donor Funding", "Own Revenue", "Public-Private Partnership", "Other"];
export const DOCUMENT_TYPES = ["Project Proposal", "Concept Note", "Work Plan", "Budget", "MOU / Agreement", "Progress Report", "Final Report", "Research Output", "Other"];
