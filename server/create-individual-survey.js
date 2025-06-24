// Script to create the Individual Need Assessment Survey
import { db } from './db.ts';
import { surveys, questions } from '../shared/schema.ts';
import { eq } from 'drizzle-orm';

async function createIndividualSurvey() {
  try {
    console.log('Creating Individual Need Assessment Survey...');
    
    // Create the survey
    const [survey] = await db.insert(surveys).values({
      name: 'Individual Need Assessment Survey',
      description: 'Comprehensive funeral planning survey for individuals to assess their needs and preferences',
      status: 'active',
      createdById: 1, // Admin user
      version: 1
    }).returning();

    console.log('Survey created:', survey.id);

    // Section 1: Basic Information
    const questionsData = [
      // Question 1
      {
        surveyId: survey.id,
        questionText: 'Are you filling out this form for:',
        questionType: 'radio',
        isRequired: true,
        options: JSON.stringify(['Yourself', 'Someone else']),
        orderIndex: 1
      },
      // Question 2 - Conditional on "Someone else"
      {
        surveyId: survey.id,
        questionText: 'Name of the person you are filling this out for:',
        questionType: 'text',
        placeholder: 'Full name',
        isRequired: true,
        conditionalQuestionId: null, // Will be set after inserting
        conditionalValue: 'Someone else',
        orderIndex: 2
      },
      {
        surveyId: survey.id,
        questionText: 'Your relationship to this person:',
        questionType: 'text',
        placeholder: 'e.g., Spouse, Child, Friend',
        isRequired: true,
        conditionalQuestionId: null, // Will be set after inserting
        conditionalValue: 'Someone else',
        orderIndex: 3
      },
      // Question 3 - Contact Information
      {
        surveyId: survey.id,
        questionText: 'Email Address:',
        questionType: 'email',
        placeholder: 'your.email@example.com',
        isRequired: true,
        orderIndex: 4
      },
      {
        surveyId: survey.id,
        questionText: 'Phone Number:',
        questionType: 'tel',
        placeholder: '(555) 123-4567',
        isRequired: true,
        orderIndex: 5
      },
      {
        surveyId: survey.id,
        questionText: 'Street Address:',
        questionType: 'text',
        placeholder: '123 Main Street',
        isRequired: true,
        orderIndex: 6
      },
      {
        surveyId: survey.id,
        questionText: 'City:',
        questionType: 'text',
        placeholder: 'Your city',
        isRequired: true,
        orderIndex: 7
      },
      {
        surveyId: survey.id,
        questionText: 'State:',
        questionType: 'select',
        isRequired: true,
        options: JSON.stringify(['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY']),
        orderIndex: 8
      },
      {
        surveyId: survey.id,
        questionText: 'Zip Code:',
        questionType: 'text',
        placeholder: '12345',
        isRequired: true,
        orderIndex: 9
      },
      {
        surveyId: survey.id,
        questionText: 'Best way to contact you:',
        questionType: 'radio',
        isRequired: true,
        options: JSON.stringify(['Email', 'Phone', 'Text']),
        orderIndex: 10
      },
      
      // Section 2: Personal Details
      {
        surveyId: survey.id,
        questionText: 'First Name:',
        questionType: 'text',
        placeholder: 'First name',
        isRequired: true,
        orderIndex: 11
      },
      {
        surveyId: survey.id,
        questionText: 'Middle Name:',
        questionType: 'text',
        placeholder: 'Middle name (optional)',
        isRequired: false,
        orderIndex: 12
      },
      {
        surveyId: survey.id,
        questionText: 'Last Name:',
        questionType: 'text',
        placeholder: 'Last name',
        isRequired: true,
        orderIndex: 13
      },
      {
        surveyId: survey.id,
        questionText: 'Date of Birth:',
        questionType: 'date',
        isRequired: true,
        orderIndex: 14
      },
      {
        surveyId: survey.id,
        questionText: 'Age:',
        questionType: 'number',
        placeholder: 'Age in years',
        isRequired: true,
        orderIndex: 15
      },
      {
        surveyId: survey.id,
        questionText: 'Sex:',
        questionType: 'radio',
        isRequired: true,
        options: JSON.stringify(['Male', 'Female', 'Other']),
        orderIndex: 16
      },
      {
        surveyId: survey.id,
        questionText: 'Race:',
        questionType: 'text',
        placeholder: 'Race/ethnicity',
        isRequired: false,
        orderIndex: 17
      },
      
      // Current Address
      {
        surveyId: survey.id,
        questionText: 'Current Street Address:',
        questionType: 'text',
        placeholder: 'Current street address',
        isRequired: true,
        orderIndex: 18
      },
      {
        surveyId: survey.id,
        questionText: 'Current City:',
        questionType: 'text',
        placeholder: 'Current city',
        isRequired: true,
        orderIndex: 19
      },
      {
        surveyId: survey.id,
        questionText: 'Current State:',
        questionType: 'select',
        isRequired: true,
        options: JSON.stringify(['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY']),
        orderIndex: 20
      },
      {
        surveyId: survey.id,
        questionText: 'Current Zip Code:',
        questionType: 'text',
        placeholder: 'Current zip code',
        isRequired: true,
        orderIndex: 21
      },
      {
        surveyId: survey.id,
        questionText: 'Inside City Limits:',
        questionType: 'radio',
        isRequired: true,
        options: JSON.stringify(['Yes', 'No']),
        orderIndex: 22
      },
      {
        surveyId: survey.id,
        questionText: 'County:',
        questionType: 'text',
        placeholder: 'County name',
        isRequired: true,
        orderIndex: 23
      },
      {
        surveyId: survey.id,
        questionText: 'Length of Residence in County:',
        questionType: 'text',
        placeholder: 'e.g., 10 years, 6 months',
        isRequired: false,
        orderIndex: 24
      },
      
      // Family Information
      {
        surveyId: survey.id,
        questionText: 'Marital Status:',
        questionType: 'radio',
        isRequired: true,
        options: JSON.stringify(['Single', 'Married', 'Divorced', 'Widowed', 'Other']),
        orderIndex: 25
      },
      {
        surveyId: survey.id,
        questionText: 'Full Name of Spouse:',
        questionType: 'text',
        placeholder: 'Spouse full name',
        isRequired: false,
        conditionalQuestionId: null, // Will be set after inserting
        conditionalValue: 'Married',
        orderIndex: 26
      },
      {
        surveyId: survey.id,
        questionText: 'If spouse is female, maiden name:',
        questionType: 'text',
        placeholder: 'Maiden name',
        isRequired: false,
        conditionalQuestionId: null, // Will be set after inserting
        conditionalValue: 'Married',
        orderIndex: 27
      },
      {
        surveyId: survey.id,
        questionText: 'Children (separate each name with a comma):',
        questionType: 'textarea',
        placeholder: 'List children names separated by commas',
        isRequired: false,
        orderIndex: 28
      },
      {
        surveyId: survey.id,
        questionText: 'Parents (separate each name with a comma):',
        questionType: 'textarea',
        placeholder: 'List parent names separated by commas',
        isRequired: false,
        orderIndex: 29
      },
      {
        surveyId: survey.id,
        questionText: 'Sisters and Brothers (separate each name with a comma):',
        questionType: 'textarea',
        placeholder: 'List sibling names separated by commas',
        isRequired: false,
        orderIndex: 30
      },
      {
        surveyId: survey.id,
        questionText: 'Grandparents (separate each name with a comma):',
        questionType: 'textarea',
        placeholder: 'List grandparent names separated by commas',
        isRequired: false,
        orderIndex: 31
      },
      {
        surveyId: survey.id,
        questionText: 'Number of Grandchildren:',
        questionType: 'number',
        placeholder: '0',
        isRequired: false,
        orderIndex: 32
      },
      {
        surveyId: survey.id,
        questionText: 'Number of Great Grandchildren:',
        questionType: 'number',
        placeholder: '0',
        isRequired: false,
        orderIndex: 33
      },
      
      // Section 3: Background Information
      {
        surveyId: survey.id,
        questionText: 'Primary Education:',
        questionType: 'text',
        placeholder: 'Schools attended for primary education',
        isRequired: false,
        orderIndex: 34
      },
      {
        surveyId: survey.id,
        questionText: 'College Education:',
        questionType: 'text',
        placeholder: 'Colleges/universities attended',
        isRequired: false,
        orderIndex: 35
      },
      {
        surveyId: survey.id,
        questionText: 'Usual Occupation (most of life, not retired):',
        questionType: 'text',
        placeholder: 'Primary occupation',
        isRequired: false,
        orderIndex: 36
      },
      {
        surveyId: survey.id,
        questionText: 'Kind of Business:',
        questionType: 'text',
        placeholder: 'Type of business/industry',
        isRequired: false,
        orderIndex: 37
      },
      {
        surveyId: survey.id,
        questionText: 'Company:',
        questionType: 'text',
        placeholder: 'Company name',
        isRequired: false,
        orderIndex: 38
      },
      {
        surveyId: survey.id,
        questionText: "Father's Full Name:",
        questionType: 'text',
        placeholder: "Father's full name",
        isRequired: false,
        orderIndex: 39
      },
      {
        surveyId: survey.id,
        questionText: "Mother's Full Maiden Name:",
        questionType: 'text',
        placeholder: "Mother's full maiden name",
        isRequired: false,
        orderIndex: 40
      },
      {
        surveyId: survey.id,
        questionText: 'Place of Birth (City, State, Country):',
        questionType: 'text',
        placeholder: 'e.g., New York, NY, USA',
        isRequired: false,
        orderIndex: 41
      },
      
      // Section 4: Planning Experience & Preferences
      {
        surveyId: survey.id,
        questionText: 'Have you ever been responsible for making funeral arrangements?',
        questionType: 'radio',
        isRequired: true,
        options: JSON.stringify(['Yes', 'No']),
        orderIndex: 42
      },
      {
        surveyId: survey.id,
        questionText: 'What is most important to you regarding funeral homes? (Select all that apply)',
        questionType: 'checkbox',
        isRequired: false,
        options: JSON.stringify([
          'Private owned and operated vs Corporation',
          'History/amount of time in business',
          'Relationship/online ratings/reviews',
          'Private owned and operated crematory',
          'Proximity to your home',
          'Proximity to your cemetery plot',
          'Religious requirements'
        ]),
        orderIndex: 43
      },
      {
        surveyId: survey.id,
        questionText: 'If private ownership is important, why?',
        questionType: 'textarea',
        placeholder: 'Please explain why private ownership matters to you',
        isRequired: false,
        orderIndex: 44
      },
      {
        surveyId: survey.id,
        questionText: 'Your home zip code (for proximity considerations):',
        questionType: 'text',
        placeholder: '12345',
        isRequired: false,
        orderIndex: 45
      },
      {
        surveyId: survey.id,
        questionText: 'Cemetery plot zip code (if applicable):',
        questionType: 'text',
        placeholder: '12345',
        isRequired: false,
        orderIndex: 46
      },
      {
        surveyId: survey.id,
        questionText: 'Religious Denomination:',
        questionType: 'text',
        placeholder: 'Your religious denomination',
        isRequired: false,
        orderIndex: 47
      },
      {
        surveyId: survey.id,
        questionText: 'Name of Church (if applicable):',
        questionType: 'text',
        placeholder: 'Church name',
        isRequired: false,
        orderIndex: 48
      },
      {
        surveyId: survey.id,
        questionText: 'Church zip code:',
        questionType: 'text',
        placeholder: '12345',
        isRequired: false,
        orderIndex: 49
      },
      
      // Section 5: Service Preferences
      {
        surveyId: survey.id,
        questionText: 'I am interested in: (Select all that apply)',
        questionType: 'checkbox',
        isRequired: true,
        options: JSON.stringify(['Burial', 'Cremation', 'Green/Eco-logical options', 'Other', 'Unsure']),
        orderIndex: 50
      },
      {
        surveyId: survey.id,
        questionText: 'If you selected "Other" above, please specify:',
        questionType: 'text',
        placeholder: 'Please specify other preferences',
        isRequired: false,
        conditionalQuestionId: null, // Will be set after inserting
        conditionalValue: 'Other',
        orderIndex: 51
      },
      {
        surveyId: survey.id,
        questionText: 'Preferred Place of Service:',
        questionType: 'radio',
        isRequired: false,
        options: JSON.stringify(['Funeral Home', 'Church', 'Other venue']),
        orderIndex: 52
      },
      {
        surveyId: survey.id,
        questionText: 'If you selected "Other venue" above, please specify:',
        questionType: 'text',
        placeholder: 'Specify other venue',
        isRequired: false,
        conditionalQuestionId: null, // Will be set after inserting
        conditionalValue: 'Other venue',
        orderIndex: 53
      },
      {
        surveyId: survey.id,
        questionText: 'What events do you want to include for your service? (Select all that apply)',
        questionType: 'checkbox',
        isRequired: false,
        options: JSON.stringify([
          'Public Viewing',
          'Private Family Viewing',
          'Private Identification',
          'Funeral Service',
          'Memorial Visitation (Church, Funeral Parlor, 3rd party location)',
          'Memorial Service (urn present)',
          'Committal Service (cemetery)',
          'Celebration of Life',
          'Digital/Remote service'
        ]),
        orderIndex: 54
      },
      
      // Cremation Preferences (Conditional)
      {
        surveyId: survey.id,
        questionText: 'Cremation preferences: (Select all that apply)',
        questionType: 'checkbox',
        isRequired: false,
        options: JSON.stringify([
          'Traditional cremation',
          'Low cost cremation options',
          'Spreading cremains',
          'Cremation keepsakes',
          'Urn (with engraving)',
          'Other'
        ]),
        conditionalQuestionId: null, // Will be set after inserting
        conditionalValue: 'Cremation',
        orderIndex: 55
      },
      {
        surveyId: survey.id,
        questionText: 'If you selected "Other" cremation preference, please specify:',
        questionType: 'text',
        placeholder: 'Specify other cremation preference',
        isRequired: false,
        conditionalQuestionId: null, // Will be set after inserting (double conditional)
        conditionalValue: 'Other',
        orderIndex: 56
      },
      {
        surveyId: survey.id,
        questionText: 'Preference for disposition of ashes:',
        questionType: 'textarea',
        placeholder: 'Describe your preferences for what should be done with ashes',
        isRequired: false,
        conditionalQuestionId: null, // Will be set after inserting
        conditionalValue: 'Cremation',
        orderIndex: 57
      },
      
      // Burial Preferences (Conditional)
      {
        surveyId: survey.id,
        questionText: 'Burial preferences: (Select all that apply)',
        questionType: 'checkbox',
        isRequired: false,
        options: JSON.stringify([
          'Casket selection assistance',
          'Family casket preferences provided',
          'Traditional burial',
          'Green burial options'
        ]),
        conditionalQuestionId: null, // Will be set after inserting
        conditionalValue: 'Burial',
        orderIndex: 58
      },
      {
        surveyId: survey.id,
        questionText: 'Name of Cemetery (if applicable):',
        questionType: 'text',
        placeholder: 'Cemetery name',
        isRequired: false,
        conditionalQuestionId: null, // Will be set after inserting
        conditionalValue: 'Burial',
        orderIndex: 59
      },
      {
        surveyId: survey.id,
        questionText: 'Cemetery City and State:',
        questionType: 'text',
        placeholder: 'City, State',
        isRequired: false,
        conditionalQuestionId: null, // Will be set after inserting
        conditionalValue: 'Burial',
        orderIndex: 60
      },
      
      // Section 6: Current Preparations
      {
        surveyId: survey.id,
        questionText: 'I have already prepared my: (Select all that apply)',
        questionType: 'checkbox',
        isRequired: false,
        options: JSON.stringify([
          'Funeral/Cremation Arrangements',
          'Cemetery Arrangements',
          'Travel and Relocation Protection',
          'Will',
          'Obituary',
          'None of the above'
        ]),
        orderIndex: 61
      },
      {
        surveyId: survey.id,
        questionText: 'In the event of your death, who would be responsible for making your arrangements?',
        questionType: 'radio',
        isRequired: true,
        options: JSON.stringify(['Spouse', 'Children', 'Family Member', 'Power of Attorney', 'Other']),
        orderIndex: 62
      },
      {
        surveyId: survey.id,
        questionText: 'If you selected "Other" above, please specify:',
        questionType: 'text',
        placeholder: 'Specify who would be responsible',
        isRequired: false,
        conditionalQuestionId: null, // Will be set after inserting
        conditionalValue: 'Other',
        orderIndex: 63
      },
      
      // Section 7: Additional Services Interest
      {
        surveyId: survey.id,
        questionText: 'I would like more information about: (Select all that apply)',
        questionType: 'checkbox',
        isRequired: false,
        options: JSON.stringify([
          'Funeral planning (Funeral Home/Venue/Officiant)',
          'Cemetery arrangements',
          'Headstone engraving',
          'Veteran benefits',
          'Travel protection',
          'Grief Counseling',
          'Death guide/doula services',
          'Non-denominational officiant/service',
          'Eco-logical/Green Options/Non-traditional options',
          'Financial Planning',
          'Attorney services (Will, POA/POM/DNR)',
          'Obituary/Memorial services'
        ]),
        orderIndex: 64
      },
      
      // Section 8: Insurance & Financial
      {
        surveyId: survey.id,
        questionText: 'Is there an insurance policy on the decedent/yourself?',
        questionType: 'radio',
        isRequired: true,
        options: JSON.stringify(['Yes', 'No']),
        orderIndex: 65
      },
      {
        surveyId: survey.id,
        questionText: 'If yes, specify insurance type:',
        questionType: 'text',
        placeholder: 'Type of insurance policy',
        isRequired: false,
        conditionalQuestionId: null, // Will be set after inserting
        conditionalValue: 'Yes',
        orderIndex: 66
      },
      
      // Veteran Information
      {
        surveyId: survey.id,
        questionText: 'Were you/was the decedent ever in the US Armed Forces?',
        questionType: 'radio',
        isRequired: true,
        options: JSON.stringify(['Yes', 'No']),
        orderIndex: 67
      },
      {
        surveyId: survey.id,
        questionText: 'Branch of Service:',
        questionType: 'radio',
        isRequired: true,
        options: JSON.stringify(['Army', 'Navy', 'Air Force', 'Marines', 'Coast Guard', 'Space Force', 'Other']),
        conditionalQuestionId: null, // Will be set after inserting
        conditionalValue: 'Yes',
        orderIndex: 68
      },
      {
        surveyId: survey.id,
        questionText: 'If you selected "Other" branch, please specify:',
        questionType: 'text',
        placeholder: 'Specify branch of service',
        isRequired: false,
        conditionalQuestionId: null, // Will be set after inserting (double conditional)
        conditionalValue: 'Other',
        orderIndex: 69
      },
      {
        surveyId: survey.id,
        questionText: 'Is a copy of discharge papers available?',
        questionType: 'radio',
        isRequired: true,
        options: JSON.stringify(['Yes', 'No']),
        conditionalQuestionId: null, // Will be set after inserting
        conditionalValue: 'Yes',
        orderIndex: 70
      },
      
      // Section 9: Special Circumstances
      {
        surveyId: survey.id,
        questionText: 'If this is an immediate need situation, date of death:',
        questionType: 'date',
        isRequired: false,
        orderIndex: 71
      },
      {
        surveyId: survey.id,
        questionText: 'Place of Death:',
        questionType: 'text',
        placeholder: 'Where did death occur',
        isRequired: false,
        orderIndex: 72
      },
      {
        surveyId: survey.id,
        questionText: 'Location of Death:',
        questionType: 'radio',
        isRequired: false,
        options: JSON.stringify(['Hospital', 'Home', 'Nursing Home', 'Other']),
        orderIndex: 73
      },
      {
        surveyId: survey.id,
        questionText: 'If other location, address:',
        questionType: 'text',
        placeholder: 'Address of other location',
        isRequired: false,
        conditionalQuestionId: null, // Will be set after inserting
        conditionalValue: 'Other',
        orderIndex: 74
      },
      {
        surveyId: survey.id,
        questionText: 'Name of the Place of Death:',
        questionType: 'text',
        placeholder: 'Hospital name, facility name, etc.',
        isRequired: false,
        orderIndex: 75
      },
      {
        surveyId: survey.id,
        questionText: 'Do you have an appointment scheduled with funeral home staff?',
        questionType: 'radio',
        isRequired: false,
        options: JSON.stringify(['Yes', 'No']),
        orderIndex: 76
      },
      
      // Section 10: Additional Information
      {
        surveyId: survey.id,
        questionText: 'Please list any other instructions or information you would like included:',
        questionType: 'textarea',
        placeholder: 'Any additional instructions or information',
        isRequired: false,
        orderIndex: 77
      },
      {
        surveyId: survey.id,
        questionText: 'Any special requests or cultural considerations:',
        questionType: 'textarea',
        placeholder: 'Special requests or cultural considerations',
        isRequired: false,
        orderIndex: 78
      },
      {
        surveyId: survey.id,
        questionText: 'How did you hear about our services?',
        questionType: 'radio',
        isRequired: false,
        options: JSON.stringify(['Online search', 'Referral from friend/family', 'Social media', 'Previous experience', 'Other']),
        orderIndex: 79
      },
      {
        surveyId: survey.id,
        questionText: 'If you selected "Other" above, please specify:',
        questionType: 'text',
        placeholder: 'How did you hear about us?',
        isRequired: false,
        conditionalQuestionId: null, // Will be set after inserting
        conditionalValue: 'Other',
        orderIndex: 80
      }
    ];

    // Insert all questions
    const insertedQuestions = await db.insert(questions).values(questionsData).returning();
    console.log(`Inserted ${insertedQuestions.length} questions`);

    // Now update conditional references
    const questionMap = {};
    insertedQuestions.forEach(q => {
      questionMap[q.orderIndex] = q.id;
    });

    // Update conditional question IDs
    const conditionalUpdates = [
      // Questions 2,3 depend on question 1
      { orderIndex: 2, conditionalQuestionId: questionMap[1] },
      { orderIndex: 3, conditionalQuestionId: questionMap[1] },
      // Questions 26,27 depend on question 25 (Marital Status)
      { orderIndex: 26, conditionalQuestionId: questionMap[25] },
      { orderIndex: 27, conditionalQuestionId: questionMap[25] },
      // Question 51 depends on question 50 (Service preferences)
      { orderIndex: 51, conditionalQuestionId: questionMap[50] },
      // Question 53 depends on question 52 (Place of service)
      { orderIndex: 53, conditionalQuestionId: questionMap[52] },
      // Questions 55,57 depend on question 50 (Cremation selected)
      { orderIndex: 55, conditionalQuestionId: questionMap[50] },
      { orderIndex: 57, conditionalQuestionId: questionMap[50] },
      // Question 56 depends on question 55 (Other cremation)
      { orderIndex: 56, conditionalQuestionId: questionMap[55] },
      // Questions 58,59,60 depend on question 50 (Burial selected)
      { orderIndex: 58, conditionalQuestionId: questionMap[50] },
      { orderIndex: 59, conditionalQuestionId: questionMap[50] },
      { orderIndex: 60, conditionalQuestionId: questionMap[50] },
      // Question 63 depends on question 62
      { orderIndex: 63, conditionalQuestionId: questionMap[62] },
      // Question 66 depends on question 65 (Insurance)
      { orderIndex: 66, conditionalQuestionId: questionMap[65] },
      // Questions 68,70 depend on question 67 (Veteran status)
      { orderIndex: 68, conditionalQuestionId: questionMap[67] },
      { orderIndex: 70, conditionalQuestionId: questionMap[67] },
      // Question 69 depends on question 68 (Other branch)
      { orderIndex: 69, conditionalQuestionId: questionMap[68] },
      // Question 74 depends on question 73 (Other location)
      { orderIndex: 74, conditionalQuestionId: questionMap[73] },
      // Question 80 depends on question 79 (Other referral)
      { orderIndex: 80, conditionalQuestionId: questionMap[79] }
    ];

    for (const update of conditionalUpdates) {
      const question = insertedQuestions.find(q => q.orderIndex === update.orderIndex);
      if (question) {
        await db.update(questions)
          .set({ conditionalQuestionId: update.conditionalQuestionId })
          .where(eq(questions.id, question.id));
      }
    }

    console.log('Updated conditional question references');
    console.log('Individual Need Assessment Survey created successfully!');
    
  } catch (error) {
    console.error('Error creating survey:', error);
  }
}

createIndividualSurvey();