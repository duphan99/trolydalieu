// types.ts

export interface Diagnosis {
  condition: string;
  severity: string;
  analysis: string;
}

export interface InClinicProcedure {
  name: string;
  frequency: string;
  description: string;
}

export interface TreatmentPlan {
  morningRoutine: string[];
  eveningRoutine: string[];
  inClinicProcedures: InClinicProcedure[];
}

export interface AnalysisResult {
  diagnosis: Diagnosis;
  treatmentPlan: TreatmentPlan;
  disclaimer: string;
}

export interface PatientInfo {
  fullName: string;
  age: string;
  address: string;
  phoneNumber: string;
  email: string;
  notes?: string;
}

export interface MachineInfo {
  name: string;
  url: string;
  description: string;
  keywords: string[];
}

export interface CosmeticInfo {
  name: string;
  url: string;
  brand: string;
  description: string;
  keywords: string[];
  usage: 'morning' | 'evening' | 'both';
}


export interface PatientRecord {
  id: string;
  createdAt: string; // ISO date string
  patientInfo: PatientInfo;
  diagnosis: Diagnosis;
  treatmentPlan: TreatmentPlan;
}

// Types for Scar Treatment Feature
export interface ScarInfo {
  scarType: string;
  location: string;
  duration: string;
  notes?: string;
}

export interface ScarTreatmentPlan {
  inClinicProcedures: InClinicProcedure[];
  homeCareRoutine: string[];
  timeline: string;
  expectedOutcome: string;
}

export interface ScarAnalysisResult {
  assessment: string;
  treatmentPlan: ScarTreatmentPlan;
  disclaimer: string;
}

export interface ScarPatientRecord {
  id: string;
  createdAt: string; // ISO date string
  patientInfo: PatientInfo;
  scarInfo: ScarInfo;
  analysisResult: ScarAnalysisResult;
}

// Types for Acne Treatment Feature
export interface AcneInfo {
  acneType: string;
  duration: string;
  triggers: string;
  pastTreatments: string;
  notes?: string;
}

export interface AcneTreatmentPlan {
  inClinicProcedures: InClinicProcedure[];
  homeCareRoutine: string[];
  lifestyleAdvice: string[];
}

export interface AcneAnalysisResult {
  assessment: string;
  treatmentPlan: AcneTreatmentPlan;
  disclaimer: string;
}

export interface AcnePatientRecord {
  id: string;
  createdAt: string;
  patientInfo: PatientInfo;
  acneInfo: AcneInfo;
  analysisResult: AcneAnalysisResult;
}

// Types for Melasma Treatment Feature
export interface MelasmaInfo {
  melasmaType: string;
  location: string;
  duration: string;
  triggers: string;
  pastTreatments: string;
  notes?: string;
}

export interface MelasmaTreatmentPlan {
  inClinicProcedures: InClinicProcedure[];
  homeCareRoutine: string[];
  sunProtectionAdvice: string[];
}

export interface MelasmaAnalysisResult {
  assessment: string;
  treatmentPlan: MelasmaTreatmentPlan;
  disclaimer: string;
}

export interface MelasmaPatientRecord {
  id: string;
  createdAt: string;
  patientInfo: PatientInfo;
  melasmaInfo: MelasmaInfo;
  analysisResult: MelasmaAnalysisResult;
}

// Types for Rejuvenation Treatment Feature
export interface RejuvenationInfo {
  mainConcerns: string;
  targetArea: string;
  pastTreatments: string;
  notes?: string;
}

export interface RejuvenationTreatmentPlan {
  highTechProcedures: InClinicProcedure[];
  injectionTherapies: InClinicProcedure[];
  homeCareRoutine: string[];
  treatmentSchedule: string[];
}

export interface RejuvenationAnalysisResult {
  assessment: string;
  treatmentPlan: RejuvenationTreatmentPlan;
  disclaimer: string;
}

export interface RejuvenationPatientRecord {
  id: string;
  createdAt: string;
  patientInfo: PatientInfo;
  rejuvenationInfo: RejuvenationInfo;
  analysisResult: RejuvenationAnalysisResult;
}


// New type for managing the selected treatment plan
export type PlanType = 'general' | 'melasma' | 'acne' | 'scar' | 'rejuvenation';

// New types for structured face image uploads
export type ImageSlot = 'front' | 'left' | 'right' | 'wood';
export type FaceImages = { [key in ImageSlot]: File | null };