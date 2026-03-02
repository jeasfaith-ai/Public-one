export enum Department {
  BusinessEd = "Business Education (B.Sc Ed)",
  FrenchEd = "French Education (B.A Ed)",
  GeographyEd = "Geography Education (B.Sc Ed)",
  MathEd = "Mathematics Education (B.Sc Ed)",
  IntegratedScienceEd = "Integrated Science Education (B.Sc Ed)",
  PhysicsEd = "Physics Education (B.Sc Ed)",
  AgricEd = "Agricultural Science Education (B.Sc Ed)",
  HomeEconsEd = "Home Economics Education (B.Sc Ed)",
  BiologyEd = "Biology Education (B.Sc Ed)",
  ChemistryEd = "Chemistry Education (B.Sc Ed)",
  ComputerRoboticsEd = "Computer & Robotics Education (B.Sc Ed)",
  MusicEd = "Music Education (B.A Ed)",
  IgboEd = "Igbo Education (B.A Ed)",
  EnglishEd = "English Language Education (B.A Ed)",
  FineArtsEd = "Fine & Applied Arts Education (B.A Ed)",
  GuidanceCounselling = "Guidance and Counselling (B.Ed)",
  HumanKineticEd = "Human Kinetic and Health Education (B.Sc Ed)",
  SocialStudiesEd = "Social Studies Education (B.Sc Ed)",
  PoliticalScienceEd = "Political Science Education (B.Sc Ed)"
}

export interface ProjectDetails {
  // Student Info
  fullName: string; // Combined for easier display, but we keep separate for specific formatting if needed
  surname: string;
  firstName: string;
  middleName: string;
  regNo: string;
  department: string;
  faculty: string;
  university: string;
  degreeProgramme: string;
  session: string;
  submissionDate: string; // Replaces 'date'
  appendixDate: string; // e.g., "3rd November, 2022"
  appendixAddress: string; // Full address block for appendix

  // Project Info
  topic: string;
  researchType: string;
  studyLocation: string;
  population: string;
  sampleSize: string;
  samplingTechnique: string;
  objectives: string;
  researchQuestions: string;
  hypotheses: string;
  instruments: string;
  dataAnalysisMethod: string;

  // Supervisor Info
  supervisorName: string;
  supervisorTitle: string;
  headOfDepartment: string;
  deanOfFaculty: string;
  internalExaminer: string;
  externalExaminer: string;
  deanUniversityOfNigeriaNsukka: string;

  // Content
  researcherName: string;
  dedication: string;
  acknowledgement: string;
  date: string; // Keep for backward compatibility
  abstractLength?: string; // e.g., "18 lines" or "250 words"

  // Generation Controls
  generateQuestionnaire: boolean;
  generateDataTables: boolean;
  simulateData: boolean;
  testHypotheses: boolean;
  generateExcel: boolean;
  includeCitations: boolean;
  figureType: 'Bar Chart' | 'Diagram';
}

export interface Citation {
  id: string;
  author: string;
  year: string;
  title: string;
  source: string;
  type: 'book' | 'journal' | 'web' | 'other';
}

export interface PdfOptions {
  fontFamily: 'times' | 'helvetica' | 'courier';
  fontSize: number;
  lineSpacing: number;
  showPageNumbers: boolean;
  pageNumberPosition: 'top-right' | 'bottom-center' | 'bottom-right';
}

export interface ProjectContent {
  coverPage?: string;
  titlePage?: string;
  declaration?: string;
  certification?: string;
  approval?: string;
  abstract: string;
  dedication: string;
  acknowledgement: string;
  tableOfContents?: string;
  listOfTables?: string;
  listOfFigures?: string;
  listOfAppendices?: string;
  chapter1: string;
  chapter2: string;
  chapter3: string;
  chapter4: string;
  chapter5: string;
  references: string;
  appendices: string;
  citations?: Citation[];
}

export type GenerationStep = 'landing' | 'topic-selection' | 'details' | 'writing' | 'review' | 'download' | 'topup' | 'notifications';
