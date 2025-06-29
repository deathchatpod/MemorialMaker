// Script to create Pre Need Basics survey with all questions
import fs from 'fs';
import path from 'path';

// Survey data structure
const surveyData = {
  name: "Pre Need Basics",
  description: "Essential information guide to help your family navigate important matters. Focus on where to find information and key contacts.",
  status: "active",
  questions: [
    // Section 1: Basic Access Information
    {
      questionText: "Full Name",
      questionType: "text",
      isRequired: true,
      orderIndex: 1,
      section: "Basic Access Information"
    },
    {
      questionText: "Preferred Name",
      questionType: "text",
      isRequired: false,
      orderIndex: 2,
      section: "Basic Access Information"
    },
    {
      questionText: "Do your loved ones need any codes or passwords to access important information?",
      questionType: "radio",
      isRequired: true,
      orderIndex: 3,
      section: "Basic Access Information",
      options: ["Yes", "No"]
    },
    {
      questionText: "Phone/Device Hint (e.g., 'mom's birthday')",
      questionType: "text",
      isRequired: false,
      orderIndex: 4,
      section: "Basic Access Information",
      conditionalQuestionId: 3,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },
    {
      questionText: "Password Manager/Safe Hint (e.g., 'our anniversary')",
      questionType: "text",
      isRequired: false,
      orderIndex: 5,
      section: "Basic Access Information",
      conditionalQuestionId: 3,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },
    {
      questionText: "Where to find full details",
      questionType: "text",
      isRequired: false,
      orderIndex: 6,
      section: "Basic Access Information",
      conditionalQuestionId: 3,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },

    // Section 2: Key People to Contact
    {
      questionText: "Emergency Contact Name",
      questionType: "text",
      isRequired: false,
      orderIndex: 7,
      section: "Key People to Contact"
    },
    {
      questionText: "Emergency Contact Relationship",
      questionType: "text",
      isRequired: false,
      orderIndex: 8,
      section: "Key People to Contact"
    },
    {
      questionText: "Emergency Contact Phone",
      questionType: "text",
      isRequired: false,
      orderIndex: 9,
      section: "Key People to Contact"
    },
    {
      questionText: "Emergency Contact Notes (e.g., 'has spare key,' 'knows my medical history')",
      questionType: "textarea",
      isRequired: false,
      orderIndex: 10,
      section: "Key People to Contact"
    },
    {
      questionText: "Do you have an Attorney?",
      questionType: "radio",
      isRequired: true,
      orderIndex: 11,
      section: "Key People to Contact",
      options: ["Yes", "No"]
    },
    {
      questionText: "Attorney Name & Phone",
      questionType: "text",
      isRequired: false,
      orderIndex: 12,
      section: "Key People to Contact",
      conditionalQuestionId: 11,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },
    {
      questionText: "Do you have a Financial Advisor/Accountant?",
      questionType: "radio",
      isRequired: true,
      orderIndex: 13,
      section: "Key People to Contact",
      options: ["Yes", "No"]
    },
    {
      questionText: "Financial Advisor/Accountant Name & Phone",
      questionType: "text",
      isRequired: false,
      orderIndex: 14,
      section: "Key People to Contact",
      conditionalQuestionId: 13,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },

    // Section 3: Important Documents
    {
      questionText: "Do you have a Will?",
      questionType: "radio",
      isRequired: true,
      orderIndex: 15,
      section: "Important Documents",
      options: ["Yes", "No", "Unsure"]
    },
    {
      questionText: "Where is your Will stored?",
      questionType: "text",
      isRequired: false,
      orderIndex: 16,
      section: "Important Documents",
      conditionalQuestionId: 15,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },
    {
      questionText: "Attorney's name for Will (if applicable)",
      questionType: "text",
      isRequired: false,
      orderIndex: 17,
      section: "Important Documents",
      conditionalQuestionId: 15,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },
    {
      questionText: "Which of these documents do you have? (Check all that apply)",
      questionType: "checkbox",
      isRequired: false,
      orderIndex: 18,
      section: "Important Documents",
      options: ["Power of Attorney (Financial)", "Power of Attorney (Healthcare)", "Living Will/Advance Directive", "Health Care Proxy"]
    },
    {
      questionText: "Designated person's name for legal documents",
      questionType: "text",
      isRequired: false,
      orderIndex: 19,
      section: "Important Documents"
    },
    {
      questionText: "Designated person's phone number",
      questionType: "text",
      isRequired: false,
      orderIndex: 20,
      section: "Important Documents"
    },
    {
      questionText: "Where are legal documents stored?",
      questionType: "text",
      isRequired: false,
      orderIndex: 21,
      section: "Important Documents"
    },

    // Section 4: Financial Information
    {
      questionText: "Have you set aside money for end-of-life expenses?",
      questionType: "radio",
      isRequired: true,
      orderIndex: 22,
      section: "Financial Information",
      options: ["Yes", "No"]
    },
    {
      questionText: "Where is end-of-life money located? (e.g., 'savings account at XYZ Bank')",
      questionType: "text",
      isRequired: false,
      orderIndex: 23,
      section: "Financial Information",
      conditionalQuestionId: 22,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },
    {
      questionText: "Is it a pre-need funeral plan?",
      questionType: "radio",
      isRequired: false,
      orderIndex: 24,
      section: "Financial Information",
      conditionalQuestionId: 22,
      conditionalValue: "Yes",
      conditionalOperator: "equals",
      options: ["Yes", "No"]
    },
    {
      questionText: "Do you have life insurance?",
      questionType: "radio",
      isRequired: true,
      orderIndex: 25,
      section: "Financial Information",
      options: ["Yes", "No"]
    },
    {
      questionText: "Life Insurance Company name",
      questionType: "text",
      isRequired: false,
      orderIndex: 26,
      section: "Financial Information",
      conditionalQuestionId: 25,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },
    {
      questionText: "Where is the life insurance policy stored?",
      questionType: "text",
      isRequired: false,
      orderIndex: 27,
      section: "Financial Information",
      conditionalQuestionId: 25,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },
    {
      questionText: "Life Insurance Beneficiary",
      questionType: "text",
      isRequired: false,
      orderIndex: 28,
      section: "Financial Information",
      conditionalQuestionId: 25,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },
    {
      questionText: "Banks/Credit Unions (Institution names only)",
      questionType: "textarea",
      isRequired: false,
      orderIndex: 29,
      section: "Financial Information"
    },
    {
      questionText: "Investment/Retirement Accounts",
      questionType: "textarea",
      isRequired: false,
      orderIndex: 30,
      section: "Financial Information"
    },
    {
      questionText: "Other accounts (crypto, etc.)",
      questionType: "textarea",
      isRequired: false,
      orderIndex: 31,
      section: "Financial Information"
    },
    {
      questionText: "Where to find account details",
      questionType: "text",
      isRequired: false,
      orderIndex: 32,
      section: "Financial Information"
    },

    // Section 5: Property & Assets
    {
      questionText: "Do you own or rent property?",
      questionType: "radio",
      isRequired: true,
      orderIndex: 33,
      section: "Property & Assets",
      options: ["Yes", "No"]
    },
    {
      questionText: "Property Address",
      questionType: "text",
      isRequired: false,
      orderIndex: 34,
      section: "Property & Assets",
      conditionalQuestionId: 33,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },
    {
      questionText: "Property Status",
      questionType: "radio",
      isRequired: false,
      orderIndex: 35,
      section: "Property & Assets",
      conditionalQuestionId: 33,
      conditionalValue: "Yes",
      conditionalOperator: "equals",
      options: ["Own", "Rent", "Lease"]
    },
    {
      questionText: "Important property contacts (mortgage lender, landlord, etc.)",
      questionType: "textarea",
      isRequired: false,
      orderIndex: 36,
      section: "Property & Assets",
      conditionalQuestionId: 33,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },
    {
      questionText: "Where are property documents stored?",
      questionType: "text",
      isRequired: false,
      orderIndex: 37,
      section: "Property & Assets",
      conditionalQuestionId: 33,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },
    {
      questionText: "Which of these do you have? (Check all that apply)",
      questionType: "checkbox",
      isRequired: false,
      orderIndex: 38,
      section: "Property & Assets",
      options: ["Storage unit", "Safe deposit box", "PO Box", "Vehicles (owned/leased)"]
    },
    {
      questionText: "Location/Details for checked items above",
      questionType: "textarea",
      isRequired: false,
      orderIndex: 39,
      section: "Property & Assets"
    },
    {
      questionText: "Where are keys/access info for these items?",
      questionType: "text",
      isRequired: false,
      orderIndex: 40,
      section: "Property & Assets"
    },

    // Section 6: Digital Life
    {
      questionText: "Do you use a password manager?",
      questionType: "radio",
      isRequired: true,
      orderIndex: 41,
      section: "Digital Life",
      options: ["Yes", "No"]
    },
    {
      questionText: "Which password manager? (LastPass, 1Password, etc.)",
      questionType: "text",
      isRequired: false,
      orderIndex: 42,
      section: "Digital Life",
      conditionalQuestionId: 41,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },
    {
      questionText: "Where to find master password",
      questionType: "text",
      isRequired: false,
      orderIndex: 43,
      section: "Digital Life",
      conditionalQuestionId: 41,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },
    {
      questionText: "Important online accounts (Check main categories)",
      questionType: "checkbox",
      isRequired: false,
      orderIndex: 44,
      section: "Digital Life",
      options: ["Email accounts", "Social media", "Banking/Financial apps", "Streaming/Subscriptions", "Work accounts", "Cloud storage"]
    },
    {
      questionText: "Where can login information be found?",
      questionType: "text",
      isRequired: false,
      orderIndex: 45,
      section: "Digital Life"
    },
    {
      questionText: "Accounts to delete",
      questionType: "textarea",
      isRequired: false,
      orderIndex: 46,
      section: "Digital Life"
    },
    {
      questionText: "Accounts to memorialize",
      questionType: "textarea",
      isRequired: false,
      orderIndex: 47,
      section: "Digital Life"
    },

    // Section 7: Ongoing Responsibilities
    {
      questionText: "Regular payments that need attention (Check all that apply)",
      questionType: "checkbox",
      isRequired: false,
      orderIndex: 48,
      section: "Ongoing Responsibilities",
      options: ["Utilities (electric, gas, water, internet)", "Subscriptions (streaming, gym, etc.)", "Insurance payments", "Regular charitable donations"]
    },
    {
      questionText: "How are these payments typically made? (e.g., 'auto-pay from checking account')",
      questionType: "text",
      isRequired: false,
      orderIndex: 49,
      section: "Ongoing Responsibilities"
    },

    // Section 8: Healthcare & Medical
    {
      questionText: "Primary Doctor Name",
      questionType: "text",
      isRequired: false,
      orderIndex: 50,
      section: "Healthcare & Medical"
    },
    {
      questionText: "Primary Doctor Phone",
      questionType: "text",
      isRequired: false,
      orderIndex: 51,
      section: "Healthcare & Medical"
    },
    {
      questionText: "Critical medications",
      questionType: "textarea",
      isRequired: false,
      orderIndex: 52,
      section: "Healthcare & Medical"
    },
    {
      questionText: "Major health conditions",
      questionType: "textarea",
      isRequired: false,
      orderIndex: 53,
      section: "Healthcare & Medical"
    },
    {
      questionText: "Preferred hospital",
      questionType: "text",
      isRequired: false,
      orderIndex: 54,
      section: "Healthcare & Medical"
    },
    {
      questionText: "Organ donation preference",
      questionType: "radio",
      isRequired: true,
      orderIndex: 55,
      section: "Healthcare & Medical",
      options: ["Yes (registered donor)", "No", "Family decides"]
    },

    // Section 9: End-of-Life Preferences
    {
      questionText: "Have you made any funeral/burial arrangements?",
      questionType: "radio",
      isRequired: true,
      orderIndex: 56,
      section: "End-of-Life Preferences",
      options: ["Yes", "No"]
    },
    {
      questionText: "Funeral home/provider",
      questionType: "text",
      isRequired: false,
      orderIndex: 57,
      section: "End-of-Life Preferences",
      conditionalQuestionId: 56,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },
    {
      questionText: "Where is funeral paperwork stored?",
      questionType: "text",
      isRequired: false,
      orderIndex: 58,
      section: "End-of-Life Preferences",
      conditionalQuestionId: 56,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },
    {
      questionText: "Service type preference",
      questionType: "radio",
      isRequired: false,
      orderIndex: 59,
      section: "End-of-Life Preferences",
      options: ["Funeral", "Memorial", "Celebration", "Private", "No preference"]
    },
    {
      questionText: "Final arrangement preference",
      questionType: "radio",
      isRequired: false,
      orderIndex: 60,
      section: "End-of-Life Preferences",
      options: ["Burial", "Cremation", "Green burial", "No preference"]
    },
    {
      questionText: "Religious/spiritual notes",
      questionType: "textarea",
      isRequired: false,
      orderIndex: 61,
      section: "End-of-Life Preferences"
    },
    {
      questionText: "Key things to mention in obituary/eulogy",
      questionType: "textarea",
      isRequired: false,
      orderIndex: 62,
      section: "End-of-Life Preferences"
    },
    {
      questionText: "Preferred charitable donations",
      questionType: "textarea",
      isRequired: false,
      orderIndex: 63,
      section: "End-of-Life Preferences"
    },

    // Section 10: Special Items & People
    {
      questionText: "Do you have specific items for specific people?",
      questionType: "radio",
      isRequired: true,
      orderIndex: 64,
      section: "Special Items & People",
      options: ["Yes", "No"]
    },
    {
      questionText: "Where is this item distribution documented?",
      questionType: "text",
      isRequired: false,
      orderIndex: 65,
      section: "Special Items & People",
      conditionalQuestionId: 64,
      conditionalValue: "Yes",
      conditionalOperator: "equals"
    },
    {
      questionText: "Person 1 - Name & relationship",
      questionType: "text",
      isRequired: false,
      orderIndex: 66,
      section: "Special Items & People"
    },
    {
      questionText: "Person 1 - How to contact",
      questionType: "text",
      isRequired: false,
      orderIndex: 67,
      section: "Special Items & People"
    },
    {
      questionText: "Person 2 - Name & relationship",
      questionType: "text",
      isRequired: false,
      orderIndex: 68,
      section: "Special Items & People"
    },
    {
      questionText: "Person 2 - How to contact",
      questionType: "text",
      isRequired: false,
      orderIndex: 69,
      section: "Special Items & People"
    },
    {
      questionText: "Employer",
      questionType: "text",
      isRequired: false,
      orderIndex: 70,
      section: "Special Items & People"
    },
    {
      questionText: "HR/Benefits contact",
      questionType: "text",
      isRequired: false,
      orderIndex: 71,
      section: "Special Items & People"
    },

    // Section 11: Final Details
    {
      questionText: "Spare house keys location/who has them",
      questionType: "text",
      isRequired: false,
      orderIndex: 72,
      section: "Final Details"
    },
    {
      questionText: "Car keys location",
      questionType: "text",
      isRequired: false,
      orderIndex: 73,
      section: "Final Details"
    },
    {
      questionText: "Safe/security codes (hint only)",
      questionType: "text",
      isRequired: false,
      orderIndex: 74,
      section: "Final Details"
    },
    {
      questionText: "Any other important information your family should know?",
      questionType: "textarea",
      isRequired: false,
      orderIndex: 75,
      section: "Final Details"
    },
    {
      questionText: "Person 1 who has copies of this information",
      questionType: "text",
      isRequired: false,
      orderIndex: 76,
      section: "Final Details"
    },
    {
      questionText: "Person 2 who has copies of this information",
      questionType: "text",
      isRequired: false,
      orderIndex: 77,
      section: "Final Details"
    },
    {
      questionText: "Backup location for this information",
      questionType: "text",
      isRequired: false,
      orderIndex: 78,
      section: "Final Details"
    }
  ]
};

console.log('Pre Need Basics Survey Data:');
console.log(JSON.stringify(surveyData, null, 2));
console.log(`\nTotal Questions: ${surveyData.questions.length}`);

// Write to file for reference
fs.writeFileSync('pre-need-basics-survey.json', JSON.stringify(surveyData, null, 2));
console.log('\nSurvey data saved to pre-need-basics-survey.json');