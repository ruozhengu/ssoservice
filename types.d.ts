type sessionTableObject = {
  sessionToken: string; // Primary Key
  authToken: string; // Ping ID
  memberID: string;
  createdTime: string;
  lastModifiedTime: string;
};

type claimTableObject = {
  submissionID: string; // Primary Key
  userUUID: string;
  memberID: string;
  claimID?: string; // Manually set by admins, may not exist
  createdTime: string;
  receivedTime?: string; // Manually set by admins, may not exist
  status: claimStatus;
  eobFile?: string; // s3 key
  type?: claimType;
};

type bankingInfoTableObject = {
  memberID: string; // Primary Key
  accountNumber: string;
  institutionNumber: string;
  transitNumber: string;
  bankName: string;
};

// eslint-disable-next-line  @typescript-eslint/no-unused-vars
const queryToDatabase = {
  memberID: {
    queryTable: "ERecordsTable",
    studentTable: "",
  },
  policyNumber: {
    queryTable: "ERecordsTable",
    studentTable: "",
  },
  claimID: {
    queryTable: "ClaimsTable",
    studentTable: "ERecordsTable",
  },
  submissionID: {
    queryTable: "ClaimsTable",
    studentTable: "ERecordsTable",
  },
  email: {
    queryTable: "ERecordsTable",
    studentTable: "",
  },
};

const claimStatusValues = ["in progress", "complete"] as const;
type claimStatus = (typeof claimStatusValues)[number];

const claimTypeValues = ["predetermination", "claim"] as const;
type claimType = (typeof claimTypeValues)[number];

const queryFieldsValues = [
  "name",
  "memberID",
  "policyNumber",
  "claimID",
  "submissionID",
  "email",
] as const;
type queryFields = (typeof queryFieldsValues)[number];
type EligibilityRecord = {
  version?: number;
  is_current?: boolean;
  uuid?: string;
  header?: Header;
  lastSeen?: string;
  operation?: string;
  recordType?: string;
  policyNumber?: string;
  memberID?: string;
  familyName?: string;
  firstName?: string;
  addressFirstLine?: string;
  addressCity?: string;
  addressSecondLine?: string;
  stateProvinceCountry?: string;
  postalCode?: string;
  sex?: string;
  language?: string;
  dateOfBirth?: string;
  sunLifeNumber?: string;
  payrollNumber?: string;
  employmentDate?: string;
  filler1?: string;
  filler2?: string;
  dateOfDeath?: string;
  dentalCoverageEffectiveDate?: string;
  dentalCoverageTerminationDate?: string;
  dentalBillingGroup?: string;
  dentalRateGroup?: string;
  dentalExperienceGroup?: string;
  dentalPlanNumber?: string;
  dependentDentalCoverageEffectiveDate?: string;
  dependentDentalBillingGroup?: string;
  dependentDentalRateGroup?: string;
  dependentDentalExperienceGroup?: string;
  dependentDentalCoverageTerminationDate?: string;
  dependentDentalPlanNumber?: string;
  medicalPSACoverageEffectiveDate?: string;
  medicalPSACoverageTerminationDate?: string;
  medicalPSABillingGroup?: string;
  medicalPSARateGroup?: string;
  medicalPSAExperienceGroup?: string;
  medicalPSAPlanNumber?: string;
  dependentMedicalCoverageEffectiveDate?: string;
  dependentMedicalCoverageTerminationDate?: string;
  dependentMedicalBillingGroup?: string;
  dependentMedicalRateGroup?: string;
  dependentMedicalExperienceGroup?: string;
  dependentMedicalPlanNumber?: string;
  bankingInfo?: string;
  specialInfo?: string;
  hsaOrPsaDate?: string;
  hsaOrPsaUpdateType?: string;
  hsaOrPsaAmount?: string;
  lateEntrantCode?: string;
  dentalCOBIndicator?: string;
  medicalCOBIndicator?: string;
  dentalHSAAmount?: string;
  filler3?: string;
  endOfFileCode?: string;
  email?: string;
  pingIDuserID?: string;
  userSignedUp?: boolean;
  versionCreatedBy?: string;
  manuallyCreatedBy?: string;
};
interface DependentRecord {
  uuid?: string;
  version?: number;
  is_current?: boolean;
  header?: Header;
  lastSeen?: string;
  policyNumber?: string;
  memberID?: string;
  dependentFirstName?: string;
  dependentLastName?: string;
  dependentSex?: string;
  dependentRelationship?: string;
  dependentDateOfBirth?: string;
  dependentEffectiveDate?: string;
  dependentTerminationDate?: string;
  studentCode?: string;
  dependentCoverageInformation?: string;
  specialInformation?: string;
  manuallyCreatedBy?: string;
}
declare module "*.pem" {
  const content: string;
  export default content;
}
