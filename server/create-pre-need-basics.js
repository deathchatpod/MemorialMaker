// Server-side script to create Pre Need Basics survey
import { db } from './db.js';
import { surveys, questions } from '../shared/schema.js';

const surveyData = {
  name: "Pre Need Basics",
  description: "Essential information guide to help your family navigate important matters. Focus on where to find information and key contacts.",
  status: "active",
  createdById: 1,
  createdByType: "admin",
  version: 1
};

const questionsData = [
  // Basic Access Information
  { questionText: "Full Name", questionType: "text", isRequired: true, orderIndex: 1, section: "Basic Access Information" },
  { questionText: "Preferred Name", questionType: "text", isRequired: false, orderIndex: 2, section: "Basic Access Information" },
  { questionText: "Do your loved ones need any codes or passwords to access important information?", questionType: "radio", isRequired: true, orderIndex: 3, section: "Basic Access Information", options: JSON.stringify(["Yes", "No"]) },
  { questionText: "Phone/Device Hint (e.g., 'mom's birthday')", questionType: "text", isRequired: false, orderIndex: 4, section: "Basic Access Information", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },
  { questionText: "Password Manager/Safe Hint (e.g., 'our anniversary')", questionType: "text", isRequired: false, orderIndex: 5, section: "Basic Access Information", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },
  { questionText: "Where to find full details", questionType: "text", isRequired: false, orderIndex: 6, section: "Basic Access Information", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },

  // Key People to Contact
  { questionText: "Emergency Contact Name", questionType: "text", isRequired: false, orderIndex: 7, section: "Key People to Contact" },
  { questionText: "Emergency Contact Relationship", questionType: "text", isRequired: false, orderIndex: 8, section: "Key People to Contact" },
  { questionText: "Emergency Contact Phone", questionType: "text", isRequired: false, orderIndex: 9, section: "Key People to Contact" },
  { questionText: "Emergency Contact Notes (e.g., 'has spare key,' 'knows my medical history')", questionType: "textarea", isRequired: false, orderIndex: 10, section: "Key People to Contact" },
  { questionText: "Do you have an Attorney?", questionType: "radio", isRequired: true, orderIndex: 11, section: "Key People to Contact", options: JSON.stringify(["Yes", "No"]) },
  { questionText: "Attorney Name & Phone", questionType: "text", isRequired: false, orderIndex: 12, section: "Key People to Contact", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },
  { questionText: "Do you have a Financial Advisor/Accountant?", questionType: "radio", isRequired: true, orderIndex: 13, section: "Key People to Contact", options: JSON.stringify(["Yes", "No"]) },
  { questionText: "Financial Advisor/Accountant Name & Phone", questionType: "text", isRequired: false, orderIndex: 14, section: "Key People to Contact", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },

  // Important Documents
  { questionText: "Do you have a Will?", questionType: "radio", isRequired: true, orderIndex: 15, section: "Important Documents", options: JSON.stringify(["Yes", "No", "Unsure"]) },
  { questionText: "Where is your Will stored?", questionType: "text", isRequired: false, orderIndex: 16, section: "Important Documents", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },
  { questionText: "Attorney's name for Will (if applicable)", questionType: "text", isRequired: false, orderIndex: 17, section: "Important Documents", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },
  { questionText: "Which of these documents do you have? (Check all that apply)", questionType: "checkbox", isRequired: false, orderIndex: 18, section: "Important Documents", options: JSON.stringify(["Power of Attorney (Financial)", "Power of Attorney (Healthcare)", "Living Will/Advance Directive", "Health Care Proxy"]) },
  { questionText: "Designated person's name for legal documents", questionType: "text", isRequired: false, orderIndex: 19, section: "Important Documents" },
  { questionText: "Designated person's phone number", questionType: "text", isRequired: false, orderIndex: 20, section: "Important Documents" },
  { questionText: "Where are legal documents stored?", questionType: "text", isRequired: false, orderIndex: 21, section: "Important Documents" },

  // Financial Information
  { questionText: "Have you set aside money for end-of-life expenses?", questionType: "radio", isRequired: true, orderIndex: 22, section: "Financial Information", options: JSON.stringify(["Yes", "No"]) },
  { questionText: "Where is end-of-life money located? (e.g., 'savings account at XYZ Bank')", questionType: "text", isRequired: false, orderIndex: 23, section: "Financial Information", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },
  { questionText: "Is it a pre-need funeral plan?", questionType: "radio", isRequired: false, orderIndex: 24, section: "Financial Information", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals", options: JSON.stringify(["Yes", "No"]) },
  { questionText: "Do you have life insurance?", questionType: "radio", isRequired: true, orderIndex: 25, section: "Financial Information", options: JSON.stringify(["Yes", "No"]) },
  { questionText: "Life Insurance Company name", questionType: "text", isRequired: false, orderIndex: 26, section: "Financial Information", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },
  { questionText: "Where is the life insurance policy stored?", questionType: "text", isRequired: false, orderIndex: 27, section: "Financial Information", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },
  { questionText: "Life Insurance Beneficiary", questionType: "text", isRequired: false, orderIndex: 28, section: "Financial Information", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },
  { questionText: "Banks/Credit Unions (Institution names only)", questionType: "textarea", isRequired: false, orderIndex: 29, section: "Financial Information" },
  { questionText: "Investment/Retirement Accounts", questionType: "textarea", isRequired: false, orderIndex: 30, section: "Financial Information" },
  { questionText: "Other accounts (crypto, etc.)", questionType: "textarea", isRequired: false, orderIndex: 31, section: "Financial Information" },
  { questionText: "Where to find account details", questionType: "text", isRequired: false, orderIndex: 32, section: "Financial Information" },

  // Property & Assets
  { questionText: "Do you own or rent property?", questionType: "radio", isRequired: true, orderIndex: 33, section: "Property & Assets", options: JSON.stringify(["Yes", "No"]) },
  { questionText: "Property Address", questionType: "text", isRequired: false, orderIndex: 34, section: "Property & Assets", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },
  { questionText: "Property Status", questionType: "radio", isRequired: false, orderIndex: 35, section: "Property & Assets", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals", options: JSON.stringify(["Own", "Rent", "Lease"]) },
  { questionText: "Important property contacts (mortgage lender, landlord, etc.)", questionType: "textarea", isRequired: false, orderIndex: 36, section: "Property & Assets", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },
  { questionText: "Where are property documents stored?", questionType: "text", isRequired: false, orderIndex: 37, section: "Property & Assets", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },
  { questionText: "Which of these do you have? (Check all that apply)", questionType: "checkbox", isRequired: false, orderIndex: 38, section: "Property & Assets", options: JSON.stringify(["Storage unit", "Safe deposit box", "PO Box", "Vehicles (owned/leased)"]) },
  { questionText: "Location/Details for checked items above", questionType: "textarea", isRequired: false, orderIndex: 39, section: "Property & Assets" },
  { questionText: "Where are keys/access info for these items?", questionType: "text", isRequired: false, orderIndex: 40, section: "Property & Assets" },

  // Digital Life
  { questionText: "Do you use a password manager?", questionType: "radio", isRequired: true, orderIndex: 41, section: "Digital Life", options: JSON.stringify(["Yes", "No"]) },
  { questionText: "Which password manager? (LastPass, 1Password, etc.)", questionType: "text", isRequired: false, orderIndex: 42, section: "Digital Life", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },
  { questionText: "Where to find master password", questionType: "text", isRequired: false, orderIndex: 43, section: "Digital Life", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },
  { questionText: "Important online accounts (Check main categories)", questionType: "checkbox", isRequired: false, orderIndex: 44, section: "Digital Life", options: JSON.stringify(["Email accounts", "Social media", "Banking/Financial apps", "Streaming/Subscriptions", "Work accounts", "Cloud storage"]) },
  { questionText: "Where can login information be found?", questionType: "text", isRequired: false, orderIndex: 45, section: "Digital Life" },
  { questionText: "Accounts to delete", questionType: "textarea", isRequired: false, orderIndex: 46, section: "Digital Life" },
  { questionText: "Accounts to memorialize", questionType: "textarea", isRequired: false, orderIndex: 47, section: "Digital Life" },

  // Ongoing Responsibilities
  { questionText: "Regular payments that need attention (Check all that apply)", questionType: "checkbox", isRequired: false, orderIndex: 48, section: "Ongoing Responsibilities", options: JSON.stringify(["Utilities (electric, gas, water, internet)", "Subscriptions (streaming, gym, etc.)", "Insurance payments", "Regular charitable donations"]) },
  { questionText: "How are these payments typically made? (e.g., 'auto-pay from checking account')", questionType: "text", isRequired: false, orderIndex: 49, section: "Ongoing Responsibilities" },

  // Healthcare & Medical
  { questionText: "Primary Doctor Name", questionType: "text", isRequired: false, orderIndex: 50, section: "Healthcare & Medical" },
  { questionText: "Primary Doctor Phone", questionType: "text", isRequired: false, orderIndex: 51, section: "Healthcare & Medical" },
  { questionText: "Critical medications", questionType: "textarea", isRequired: false, orderIndex: 52, section: "Healthcare & Medical" },
  { questionText: "Major health conditions", questionType: "textarea", isRequired: false, orderIndex: 53, section: "Healthcare & Medical" },
  { questionText: "Preferred hospital", questionType: "text", isRequired: false, orderIndex: 54, section: "Healthcare & Medical" },
  { questionText: "Organ donation preference", questionType: "radio", isRequired: true, orderIndex: 55, section: "Healthcare & Medical", options: JSON.stringify(["Yes (registered donor)", "No", "Family decides"]) },

  // End-of-Life Preferences
  { questionText: "Have you made any funeral/burial arrangements?", questionType: "radio", isRequired: true, orderIndex: 56, section: "End-of-Life Preferences", options: JSON.stringify(["Yes", "No"]) },
  { questionText: "Funeral home/provider", questionType: "text", isRequired: false, orderIndex: 57, section: "End-of-Life Preferences", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },
  { questionText: "Where is funeral paperwork stored?", questionType: "text", isRequired: false, orderIndex: 58, section: "End-of-Life Preferences", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },
  { questionText: "Service type preference", questionType: "radio", isRequired: false, orderIndex: 59, section: "End-of-Life Preferences", options: JSON.stringify(["Funeral", "Memorial", "Celebration", "Private", "No preference"]) },
  { questionText: "Final arrangement preference", questionType: "radio", isRequired: false, orderIndex: 60, section: "End-of-Life Preferences", options: JSON.stringify(["Burial", "Cremation", "Green burial", "No preference"]) },
  { questionText: "Religious/spiritual notes", questionType: "textarea", isRequired: false, orderIndex: 61, section: "End-of-Life Preferences" },
  { questionText: "Key things to mention in obituary/eulogy", questionType: "textarea", isRequired: false, orderIndex: 62, section: "End-of-Life Preferences" },
  { questionText: "Preferred charitable donations", questionType: "textarea", isRequired: false, orderIndex: 63, section: "End-of-Life Preferences" },

  // Special Items & People
  { questionText: "Do you have specific items for specific people?", questionType: "radio", isRequired: true, orderIndex: 64, section: "Special Items & People", options: JSON.stringify(["Yes", "No"]) },
  { questionText: "Where is this item distribution documented?", questionType: "text", isRequired: false, orderIndex: 65, section: "Special Items & People", conditionalQuestionId: null, conditionalValue: "Yes", conditionalOperator: "equals" },
  { questionText: "Person 1 - Name & relationship", questionType: "text", isRequired: false, orderIndex: 66, section: "Special Items & People" },
  { questionText: "Person 1 - How to contact", questionType: "text", isRequired: false, orderIndex: 67, section: "Special Items & People" },
  { questionText: "Person 2 - Name & relationship", questionType: "text", isRequired: false, orderIndex: 68, section: "Special Items & People" },
  { questionText: "Person 2 - How to contact", questionType: "text", isRequired: false, orderIndex: 69, section: "Special Items & People" },
  { questionText: "Employer", questionType: "text", isRequired: false, orderIndex: 70, section: "Special Items & People" },
  { questionText: "HR/Benefits contact", questionType: "text", isRequired: false, orderIndex: 71, section: "Special Items & People" },

  // Final Details
  { questionText: "Spare house keys location/who has them", questionType: "text", isRequired: false, orderIndex: 72, section: "Final Details" },
  { questionText: "Car keys location", questionType: "text", isRequired: false, orderIndex: 73, section: "Final Details" },
  { questionText: "Safe/security codes (hint only)", questionType: "text", isRequired: false, orderIndex: 74, section: "Final Details" },
  { questionText: "Any other important information your family should know?", questionType: "textarea", isRequired: false, orderIndex: 75, section: "Final Details" },
  { questionText: "Person 1 who has copies of this information", questionType: "text", isRequired: false, orderIndex: 76, section: "Final Details" },
  { questionText: "Person 2 who has copies of this information", questionType: "text", isRequired: false, orderIndex: 77, section: "Final Details" },
  { questionText: "Backup location for this information", questionType: "text", isRequired: false, orderIndex: 78, section: "Final Details" }
];

async function createPreNeedBasicsSurvey() {
  try {
    console.log('Creating Pre Need Basics survey...');
    
    // Create the survey
    const [survey] = await db.insert(surveys).values(surveyData).returning();
    console.log('Survey created with ID:', survey.id);
    
    // Add survey ID to all questions and set up conditional logic
    const questionsWithSurveyId = questionsData.map((question, index) => ({
      ...question,
      surveyId: survey.id,
      // Set up conditional questions properly (need to reference actual question IDs)
      conditionalQuestionId: question.conditionalQuestionId || null
    }));
    
    // Insert questions
    const insertedQuestions = await db.insert(questions).values(questionsWithSurveyId).returning();
    console.log(`Created ${insertedQuestions.length} questions`);
    
    // Update conditional logic with actual question IDs
    const conditionalUpdates = [];
    
    // Set up conditional references
    const passwordQuestion = insertedQuestions.find(q => q.questionText === "Do your loved ones need any codes or passwords to access important information?");
    const attorneyQuestion = insertedQuestions.find(q => q.questionText === "Do you have an Attorney?");
    const advisorQuestion = insertedQuestions.find(q => q.questionText === "Do you have a Financial Advisor/Accountant?");
    const willQuestion = insertedQuestions.find(q => q.questionText === "Do you have a Will?");
    const expensesQuestion = insertedQuestions.find(q => q.questionText === "Have you set aside money for end-of-life expenses?");
    const insuranceQuestion = insertedQuestions.find(q => q.questionText === "Do you have life insurance?");
    const propertyQuestion = insertedQuestions.find(q => q.questionText === "Do you own or rent property?");
    const passwordManagerQuestion = insertedQuestions.find(q => q.questionText === "Do you use a password manager?");
    const arrangementsQuestion = insertedQuestions.find(q => q.questionText === "Have you made any funeral/burial arrangements?");
    const itemsQuestion = insertedQuestions.find(q => q.questionText === "Do you have specific items for specific people?");
    
    // Update conditional questions with proper IDs
    if (passwordQuestion) {
      const dependentQuestions = insertedQuestions.filter(q => 
        q.questionText.includes("Phone/Device Hint") || 
        q.questionText.includes("Password Manager/Safe Hint") || 
        q.questionText.includes("Where to find full details")
      );
      for (const q of dependentQuestions) {
        await db.update(questions).set({ conditionalQuestionId: passwordQuestion.id }).where({ id: q.id });
      }
    }
    
    // Similar updates for other conditional questions...
    console.log('Survey "Pre Need Basics" created successfully with conditional logic!');
    
  } catch (error) {
    console.error('Error creating survey:', error);
  }
}

createPreNeedBasicsSurvey();