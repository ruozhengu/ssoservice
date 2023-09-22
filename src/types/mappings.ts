export const queryToDatabase = {
  memberID: {
    queryTable: process.env.ERecordsTable,
    studentTable: "",
  },
  policyNumber: {
    queryTable: process.env.ERecordsTable,
    studentTable: "",
  },
  claimID: {
    queryTable: process.env.ClaimsTable,
    studentTable: process.env.ERecordsTable,
  },
  submissionID: {
    queryTable: process.env.ClaimsTable,
    studentTable: process.env.ERecordsTable,
  },
  email: {
    queryTable: process.env.ERecordsTable,
    studentTable: "",
  },
};

export const claimStatusValues = ["in progress", "complete"] as const;

export const claimTypeValues = ["predetermination", "claim"] as const;

export const queryFieldsValues = [
  "memberID",
  "policyNumber",
  "claimID",
  "submissionID",
  "email",
] as const;
