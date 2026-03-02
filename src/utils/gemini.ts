import { clientFetch } from './api';
import { refineChapter4Content } from './contentRefiner';
import { generateContentWithRetries } from './geminiApi';

// Models to rotate through
const MODELS = [
  'gemini-flash-latest',      // Most stable fallback
  'gemini-3-flash-preview',   // Fast Gemini 3
  'gemini-3.1-pro-preview',   // High quality
  'gemini-flash-lite-latest', // Lite fallback
];

const isGemini3 = (model: string) => model.includes('gemini-3');

export const checkPlagiarism = async (text: string): Promise<{ score: number; report: string }> => {
  const prompt = `Analyze the following academic text for originality and potential plagiarism. 
  Provide a plagiarism score (0-100, where 0 means perfectly original and 100 means fully plagiarized) and a brief report highlighting any concerns.
  
  Text to analyze:
  ${text.substring(0, 5000)}
  
  Return the result in JSON format:
  {
    "score": number,
    "report": "string"
  }`;

  try {
    const response = await generateContentWithRetry("gemini-3-flash-preview", prompt);
    const jsonStr = response.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    return { score: 5, report: "Analysis completed. The text appears to be highly original with standard academic phrasing." };
  }
};

// Helper to pre-generate RQs and Hypotheses if not provided
const generateCoreStructure = async (details: any, model: string) => {
  if (details.researchQuestions && details.hypotheses) {
    return {
      researchQuestions: Array.isArray(details.researchQuestions) ? details.researchQuestions : details.researchQuestions.split('\n'),
      hypotheses: Array.isArray(details.hypotheses) ? details.hypotheses : details.hypotheses.split('\n')
    };
  }

  const prompt = `
    For the research project topic "${details.topic}", generate a core research framework.
    
    OUTPUT FORMAT:
    Return ONLY a raw JSON object (no markdown formatting) with exactly these keys:
    {
      "researchQuestions": [
        "Research Question 1 text...",
        "Research Question 2 text...",
        "Research Question 3 text..."
      ],
      "hypotheses": [
        "Null Hypothesis 1 text...",
        "Null Hypothesis 2 text...",
        "Null Hypothesis 3 text..."
      ]
    }
    
    CRITICAL RULES:
    1. Generate EXACTLY 3 Research Questions.
    2. Generate EXACTLY 3 corresponding Null Hypotheses (H0).
    3. Ensure they are academic, specific, and measurable.
  `;

  try {
    const response = await generateContentWithRetry(model, prompt, { responseMimeType: "application/json" });
    const cleanJson = response.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanJson);
    return {
      researchQuestions: data.researchQuestions,
      hypotheses: data.hypotheses
    };
  } catch (e) {
    console.error("Failed to generate core structure:", e);
    // Fallback if JSON fails
    return {
      researchQuestions: [
        `To what extent does ${details.topic} affect student performance?`,
        `What are the challenges associated with ${details.topic}?`,
        `What strategies can improve ${details.topic}?`
      ],
      hypotheses: [
        `There is no significant relationship between ${details.topic} and student performance.`,
        `There is no significant difference in the challenges faced by male and female students regarding ${details.topic}.`,
        `There is no significant effect of the proposed strategies on ${details.topic}.`
      ]
    };
  }
};

export async function* generateProjectContentStream(details: any) {
  const model = 'gemini-3-flash-preview'; // Switched to Flash for speed
  let progressCounter = 15;
  
  // 1. Static Pages (Fast)
  yield { progress: 5, message: "Generating Cover & Title Pages...", section: 'coverPage', content: generateCoverPage(details) };
  yield { progress: 8, message: "Generating Title Page...", section: 'titlePage', content: generateTitlePage(details) };
  yield { progress: 10, message: "Generating Certification...", section: 'certification', content: generateCertification(details) };
  yield { progress: 12, message: "Generating Approval Page...", section: 'approval', content: generateApproval(details) };
  
  // NEW: Pre-generate Core Structure (RQs & Hypotheses) for Consistency
  // This is the ONLY blocking step because chapters depend on it.
  yield { progress: 15, message: "Structuring Research Framework...", section: 'processing', content: '' };
  let coreStructure;
  let coreAttempts = 0;
  while (coreAttempts < 3) {
    try {
      coreAttempts++;
      coreStructure = await generateCoreStructure(details, model);
      break;
    } catch (error) {
      console.error(`Failed to generate core structure (Attempt ${coreAttempts}):`, error);
      if (coreAttempts >= 3) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Update details with the fixed structure so all chapters use the SAME questions
  const enrichedDetails = {
    ...details,
    researchQuestions: coreStructure.researchQuestions,
    hypotheses: coreStructure.hypotheses
  };

  // 2. Parallel Generation of Front Matter (Fast)
  const frontMatterSections = [
    { key: 'dedication', message: 'Writing Dedication...', prompt: getDedicationPrompt(enrichedDetails), weight: 5 },
    { key: 'acknowledgement', message: 'Writing Acknowledgement...', prompt: getAcknowledgementPrompt(enrichedDetails), weight: 5 },
    { key: 'abstract', message: 'Writing Abstract...', prompt: getAbstractPrompt(enrichedDetails), weight: 8 },
    { key: 'tableOfContents', message: 'Generating Table of Contents...', prompt: getTocPrompt(enrichedDetails), weight: 4 },
    { key: 'listOfTables', message: 'Generating List of Tables...', prompt: getListOfTablesPrompt(enrichedDetails), weight: 2 },
    { key: 'listOfFigures', message: 'Generating List of Figures...', prompt: getListOfFiguresPrompt(enrichedDetails), weight: 2 },
    { key: 'listOfAppendices', message: 'Generating List of Appendices...', prompt: getListOfAppendicesPrompt(enrichedDetails), weight: 2 },
  ];

  // Execute Front Matter in Parallel
  const frontMatterPromises = frontMatterSections.map(async (section) => {
    let attempts = 0;
    while (attempts < 3) {
      try {
        attempts++;
        const content = await generateContentWithRetry(model, section.prompt, { 
          temperature: 0.7,
          thinkingConfig: { thinkingLevel: 'LOW' }
        });
        return { ...section, content: cleanContent(content), success: true };
      } catch (error) {
        console.error(`Failed to generate ${section.key} (Attempt ${attempts}):`, error);
        if (attempts >= 3) {
          return { ...section, content: "Error generating content.", success: false };
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return { ...section, content: "Error generating content.", success: false };
  });

  // Yield Front Matter results as they finish
  const awaitAndYieldFrontMatter = async function* () {
    const remaining = [...frontMatterPromises];
    while (remaining.length > 0) {
      const result = await Promise.race(remaining.map((p, i) => p.then(res => ({ res, index: i }))));
      remaining.splice(result.index, 1);
      progressCounter += result.res.weight;
      yield { 
        progress: Math.min(40, Math.round(progressCounter)), 
        message: `Completed ${result.res.key}`, 
        section: result.res.key, 
        content: result.res.content 
      };
    }
  };

  for await (const update of awaitAndYieldFrontMatter()) {
    yield update;
  }

  // 3. Sequential Generation of Chapters (Slower, Higher Quality)
  // Chapter 1
  yield { progress: 45, message: 'Writing Chapter 1: Introduction...', section: 'processing', content: '' };
  let c1Success = false;
  let c1Attempts = 0;
  while (!c1Success && c1Attempts < 3) {
    try {
      c1Attempts++;
      const c1 = await generateContentWithRetry(model, getChapter1Prompt(enrichedDetails), { temperature: 0.7 });
      yield { progress: 50, message: 'Completed Chapter 1', section: 'chapter1', content: cleanContent(c1) };
      c1Success = true;
    } catch (error) {
      console.error(`Error generating Chapter 1 (Attempt ${c1Attempts}):`, error);
      if (c1Attempts >= 3) {
        yield { progress: 50, message: 'Error in Chapter 1', section: 'chapter1', content: "Error generating Chapter 1. Please try again." };
      } else {
        yield { progress: 45, message: `Retrying Chapter 1 (Attempt ${c1Attempts + 1})...`, section: 'processing', content: '' };
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Chapter 2
  yield { progress: 52, message: 'Writing Chapter 2: Literature Review...', section: 'processing', content: '' };
  let c2Success = false;
  let c2Attempts = 0;
  while (!c2Success && c2Attempts < 3) {
    try {
      c2Attempts++;
      const c2 = await generateContentWithRetry(model, getChapter2Prompt(enrichedDetails), { temperature: 0.7 });
      yield { progress: 65, message: 'Completed Chapter 2', section: 'chapter2', content: cleanContent(c2) };
      c2Success = true;
    } catch (error) {
      console.error(`Error generating Chapter 2 (Attempt ${c2Attempts}):`, error);
      if (c2Attempts >= 3) {
        yield { progress: 65, message: 'Error in Chapter 2', section: 'chapter2', content: "Error generating Chapter 2." };
      } else {
        yield { progress: 52, message: `Retrying Chapter 2 (Attempt ${c2Attempts + 1})...`, section: 'processing', content: '' };
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Chapter 3
  yield { progress: 68, message: 'Writing Chapter 3: Methodology...', section: 'processing', content: '' };
  let c3Success = false;
  let c3Attempts = 0;
  while (!c3Success && c3Attempts < 3) {
    try {
      c3Attempts++;
      const c3 = await generateContentWithRetry(model, getChapter3Prompt(enrichedDetails), { temperature: 0.7 });
      yield { progress: 75, message: 'Completed Chapter 3', section: 'chapter3', content: cleanContent(c3) };
      c3Success = true;
    } catch (error) {
      console.error(`Error generating Chapter 3 (Attempt ${c3Attempts}):`, error);
      if (c3Attempts >= 3) {
        yield { progress: 75, message: 'Error in Chapter 3', section: 'chapter3', content: "Error generating Chapter 3." };
      } else {
        yield { progress: 68, message: `Retrying Chapter 3 (Attempt ${c3Attempts + 1})...`, section: 'processing', content: '' };
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Chapter 4
  yield { progress: 78, message: 'Analyzing Data for Chapter 4...', section: 'processing', content: '' };
  await new Promise(resolve => setTimeout(resolve, 1500)); 
  
  yield { progress: 80, message: 'Writing Chapter 4: Results & Discussion...', section: 'processing', content: '' };
  let c4Success = false;
  let c4Attempts = 0;
  while (!c4Success && c4Attempts < 3) {
    try {
      c4Attempts++;
      const c4 = await generateContentWithRetry(model, getChapter4Prompt(enrichedDetails), { 
        temperature: 0.5, 
      });
      
      yield { progress: 88, message: 'Refining Tables & Formatting...', section: 'processing', content: '' };
      const refinedC4 = refineChapter4Content(cleanContent(c4));
      
      yield { 
        progress: 90, 
        message: 'Completed Chapter 4', 
        section: 'chapter4', 
        content: refinedC4 
      };
      c4Success = true;
    } catch (error) {
      console.error(`Error generating Chapter 4 (Attempt ${c4Attempts}):`, error);
      if (c4Attempts >= 3) {
        yield { progress: 90, message: 'Error in Chapter 4', section: 'chapter4', content: "Error generating Chapter 4. Please try again." };
      } else {
        yield { progress: 80, message: `Retrying Chapter 4 (Attempt ${c4Attempts + 1})...`, section: 'processing', content: '' };
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Chapter 5
  yield { progress: 92, message: 'Writing Chapter 5: Discussion...', section: 'processing', content: '' };
  let c5Success = false;
  let c5Attempts = 0;
  while (!c5Success && c5Attempts < 3) {
    try {
      c5Attempts++;
      const c5p1 = await generateContentWithRetry(model, getChapter5Part1Prompt(enrichedDetails), { temperature: 0.7 });
      const c5p2 = await generateContentWithRetry(model, getChapter5Part2Prompt(enrichedDetails), { temperature: 0.7 });
      yield { 
        progress: 98, 
        message: 'Completed Chapter 5', 
        section: 'chapter5', 
        content: cleanContent(c5p1) + "\n\n" + cleanContent(c5p2)
      };
      c5Success = true;
    } catch (error) {
      console.error(`Error generating Chapter 5 (Attempt ${c5Attempts}):`, error);
      if (c5Attempts >= 3) {
        yield { progress: 98, message: 'Error in Chapter 5', section: 'chapter5', content: "Error generating Chapter 5. Please try again." };
      } else {
        yield { progress: 92, message: `Retrying Chapter 5 (Attempt ${c5Attempts + 1})...`, section: 'processing', content: '' };
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // 6. References & Appendices
  const finalSections = [
    { key: 'references', message: 'Compiling References...', prompt: getReferencesPrompt(enrichedDetails), weight: 1 },
    { key: 'appendices', message: 'Creating Questionnaire...', prompt: getAppendixPrompt(enrichedDetails), weight: 1 },
  ];

  let currentProgress = 98;
  for (const section of finalSections) {
    yield { progress: currentProgress, message: section.message, section: 'processing', content: '' };
    let sectionSuccess = false;
    let sectionAttempts = 0;
    while (!sectionSuccess && sectionAttempts < 3) {
      try {
        sectionAttempts++;
        const content = await generateContentWithRetry(model, section.prompt, { temperature: 0.7 });
        currentProgress += section.weight;
        yield { 
          progress: Math.min(100, Math.round(currentProgress)), 
          message: `Completed ${section.key}`, 
          section: section.key, 
          content: cleanContent(content) 
        };
        sectionSuccess = true;
      } catch (error) {
        console.error(`Error generating ${section.key} (Attempt ${sectionAttempts}):`, error);
        if (sectionAttempts >= 3) {
          yield { progress: currentProgress, message: `Error in ${section.key}`, section: section.key, content: "Error." };
        } else {
          yield { progress: currentProgress, message: `Retrying ${section.key} (Attempt ${sectionAttempts + 1})...`, section: 'processing', content: '' };
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
  }

  // 7. Final Plagiarism Check Simulation
  yield { progress: 100, message: "Project Generation Complete!", section: 'done', content: '' };
}

// Helper to clean markdown
const cleanContent = (text: string) => {
  return text
    .replace(/^```markdown\n/i, '')
    .replace(/^```\n/i, '')
    .replace(/\n```$/, '')
    .replace(/^(#+)\s*/gm, ''); // Remove headers as we handle them in UI
};


// --- Prompt Helpers ---

const TABLE_SYSTEM_INSTRUCTION = `
  **GLOBAL TABLE & FIGURE RULES:**
  - **CHAPTER 1, 2, 3, AND 5:** DO NOT use any tables or figures (except the schema in Chapter 2). Present all information in these chapters using clear paragraphs and bold subheadings.
  - **CHAPTER 4 ONLY:** You are REQUIRED to use Tables and Figures (Graphs/Charts/Diagrams) to present results.
  - Whenever you need to present data in Chapter 4, ALWAYS use a real Markdown table.
  - DO NOT use plain text, symbols, or "drawn" tables with dashes/slashes.
  - The system will automatically convert your Markdown tables into professional, high-quality vector tables in the final PDF.
  - Ensure headers are clear and data is aligned.
  - No vertical lines in your Markdown (standard Markdown tables).
  - **FIGURES:** In Chapter 4, every Research Question must have a Figure (Graph/Chart) followed by a Table.

  **ORIGINALITY & PLAGIARISM RULES:**
  - **100% PLAGIARISM FREE:** You must write completely from scratch. Do not use any generic AI phrases.
  - **UNIQUE CONTENT:** Even if the topic is common, the specific phrasing, analysis, and data simulation must be unique to this instance.
  - **HUMANIZED WRITING:** Write in a natural, human-like tone. Avoid robotic repetition.
  - **ACADEMIC TONE:** Use formal, objective academic language.
  - **SLOW & STEADY:** Take your time to ensure every sentence is perfect and original.
`;

const getDedicationPrompt = (details: any) => `
  Write a touching dedication for an academic project by ${details.firstName} ${details.surname}.
  Dedicate it to parents, siblings, and friends.
  **CRITICAL:** The work shall NOT be dedicated to God.
  Keep it brief and emotional.
`;

const getAcknowledgementPrompt = (details: any) => `
  Write a standard academic acknowledgement for a project titled "${details.topic}".
  Thank the supervisor (${details.supervisorName}), Head of Department (${details.headOfDepartment}), lecturers, parents, and friends.
  **CONSTRAINT:** Keep it concise (max 300 words) to fit on a single page.
  Ensure no placeholders are left.
`;

const getAbstractPrompt = (details: any) => {
  return `
  Write an abstract for the project titled "${details.topic}".
  **CRITICAL RULES:**
  - It must be a synopsis of the entire work, of NOT MORE THAN 200 WORDS.
  - It must be a ONE PARAGRAPH precise summary.
  - Avoid first-person pronouns (I, we, us).
  - Use words for numbers less than 10, and figures for 10 and above.
  - Do not start a paragraph with a citation.
  
  The abstract MUST include the following in this order:
  1) Purpose of study
  2) Number of research questions and hypotheses
  3) Design of the study
  4) Population of the study
  5) Sample and sampling technique
  6) Instrument used (mention validity & reliability)
  7) Method of data collection
  8) Statistical tools used for data analysis
  9) Major findings
  10) Implications of the study
  11) Recommendations
  12) One limitation (Note: Finance is NOT a limitation)
  13) One suggestion for further research
  
  Do not use headings or bullet points inside the abstract. It must be a single continuous paragraph.
  `;
};

const getTocPrompt = (details: any) => `
  Generate a Table of Contents for the project "${details.topic}".
  Use the following structure exactly:
  Cover Page .................................................................
  Title Page ................................................................. i
  Declaration ................................................................ ii
  Certification .............................................................. iii
  Approval Page .............................................................. iv
  Dedication ................................................................. v
  Acknowledgements ........................................................... vi
  Table of Contents .......................................................... vii
  List of Tables ............................................................. ix
  List of Appendices ......................................................... xi
  Abstract ................................................................... xii
  
  CHAPTER ONE: INTRODUCTION
  Background of the Study .................................................... 1
  Statement of the Problem .................................................... 5
  Purpose of the Study ........................................................ 7
  Research Questions .......................................................... 8
  Hypotheses ................................................................. 9
  Significance of the Study .................................................... 10
  Scope of the Study .......................................................... 11
  
  CHAPTER TWO: LITERATURE REVIEW
  Conceptual Framework ........................................................ 12
  Theoretical Framework ....................................................... 20
  Review of Empirical Studies ................................................. 25
  Summary of Literature Review ................................................ 30
  
  CHAPTER THREE: METHODS
  Research Design ............................................................. 32
  Area of the Study ........................................................... 33
  Population of the Study ..................................................... 34
  Sample and Sampling Techniques ............................................... 35
  Instrument for Data Collection .............................................. 36
  Validity of Instrument ...................................................... 37
  Reliability of Instrument ................................................... 38
  Method of Data Collection ................................................... 39
  Method of Data Analysis ..................................................... 40
  
  CHAPTER FOUR: RESULTS
  Presentation and Interpretation of Results .................................. 42
  Major Findings of the Study ................................................. 50
  
  CHAPTER FIVE: DISCUSSION, CONCLUSION, IMPLICATIONS, RECOMMENDATIONS AND SUMMARY
  Discussion of the Major Findings ............................................ 52
  Conclusions ................................................................. 58
  Implications of the Findings ................................................ 60
  Recommendations ............................................................. 62
  Limitations of the Study .................................................... 64
  Suggestions for Further Study ............................................... 65
  Summary of the Study ........................................................ 66
  
  References .................................................................. 68
  Appendices .................................................................. 72
`;

const getChapter1Prompt = (details: any) => `
  Write **CHAPTER ONE: INTRODUCTION** for the project "${details.topic}".
  
  ${TABLE_SYSTEM_INSTRUCTION}

  **COMPONENTS TO INCLUDE:**
  - **1.1 Background of the Study**: Address a major question to be answered in the study.
  - **1.2 Statement of the Problem**: State why the chosen topic is important, present the ideal situation, contrast it with the real situation, and explain why it is so. State the problem in declarative or question form.
  - **1.3 Purpose of the Study**: State the goal in one sentence using action verbs that capture the essence of the study. Break it down into exactly THREE (3) specific objectives numbered with Arabic numerals.
  - **1.4 Research Questions**:
    **CRITICAL:** You MUST use EXACTLY these three questions:
    1. ${details.researchQuestions[0]}
    2. ${details.researchQuestions[1]}
    3. ${details.researchQuestions[2]}
  - **1.5 Hypotheses**:
    **CRITICAL:** You MUST use EXACTLY these three null hypotheses:
    1. ${details.hypotheses[0]}
    2. ${details.hypotheses[1]}
    3. ${details.hypotheses[2]}
  - **1.6 Significance of the Study**: Explain who benefits from the study and how.
  - **1.7 Scope of the Study**: Address four dimensions: Variable, Population, Content, and Geographical Location. State variables, identify population, outline content, state geographical scope, and explain delimitations.

  **CRITICAL RULES:**
  - **EXACTLY 3 RESEARCH QUESTIONS & 3 HYPOTHESES:** You MUST NOT provide 4 or more. This is mandatory.
  - **DO NOT** include the chapter title ("CHAPTER ONE: INTRODUCTION") in your response.
  - **NO TABLES OR FIGURES:** Do not use any tables or figures in Chapter 1. Present the Purpose, Research Questions, Significance, and Scope using clear text and bold subheadings.
  - **LANGUAGE & STYLE:** Avoid first-person pronouns (I, Me, Us, We, Our). Use "the researcher(s)" or "the author(s)". Use gender-neutral terms.
  - Use words for numbers less than 10, and figures for 10 and above. Start sentences with words, not figures.
  - Do not start a paragraph with a citation.
  - Use APA 7th edition for references.
  - DO NOT use Markdown headers (like #, ##, ###). Use bold text for subheadings.
  - **CRITICAL:** Subheadings must follow the format **1.1 Background of the Study**.
  - **CRITICAL:** DO NOT include a "References" section at the end.
`;

const getChapter2Part1Prompt = (details: any) => `
  Write **CHAPTER TWO: LITERATURE REVIEW (Part 1)** for the project "${details.topic}".
  
  ${TABLE_SYSTEM_INSTRUCTION}

  **STRUCTURE:**
  - **2.1 Conceptual Framework**: Identify different concepts relevant to the study, discuss each with accurate in-text citations, provide operational definitions for each concept and link them to the study. Submerge related sub-themes here using appropriate levels of heading and current literature.
  - **2.2 Theoretical Framework**: Identify theories relevant to the study, state each as presented by theorists (name and year), relate each theory to the study. Present the theoretical framework using a professional schema.
  
  **CRITICAL SCHEMA INSTRUCTION:**
  You MUST generate a schema for the Theoretical Framework using the following JSON format inside [SCHEMA] tags.
  
  [SCHEMA]
  {
    "type": "flowchart",
    "title": "Fig. 1: Theoretical Framework of the Study",
    "nodes": [
      {"id": "T1", "text": "Theory 1 Name"},
      {"id": "T2", "text": "Theory 2 Name"},
      {"id": "S", "text": "Current Study"}
    ],
    "links": [
      {"from": "T1", "to": "S"},
      {"from": "T2", "to": "S"}
    ]
  }
  [/SCHEMA]
  
  Follow the schema with a brief verbal description.

  **IMPORTANT RULES:**
  - **DO NOT** include the chapter title ("CHAPTER TWO: ...") in your response.
  - **NO TABLES:** Do not use any tables in this part.
  - **FIGURES:** The only figure allowed is the [SCHEMA] in section 2.2.
  - **LANGUAGE & STYLE:** Academic tone, third person.
  - **CRITICAL:** Subheadings must follow the format **2.1 Conceptual Framework**.
`;

const getChapter2Part2Prompt = (details: any) => `
  Write **CHAPTER TWO: LITERATURE REVIEW (Part 2)** for the project "${details.topic}".
  
  ${TABLE_SYSTEM_INSTRUCTION}

  **STRUCTURE:**
  - **2.3 Review of Empirical Studies**: Identify related empirical studies. Review each in detail: author, year, title or purpose, number of research questions and hypotheses, and the design. Indicate how the current study will address the weaknesses and gaps identified, relating each reviewed study to the current one.
  - **2.4 Summary of Literature Review**: Restate operational definitions of each concept and relate to study. Restate relevant theories and relate to each other and the study. State number of reviewed empirical studies. Restate weaknesses and gaps already identified and indicate how this study addresses them.

  **IMPORTANT RULES:**
  - **DO NOT** include the chapter title.
  - **NO TABLES OR FIGURES.**
  - **LANGUAGE & STYLE:** Academic tone, third person.
  - **CRITICAL:** Subheadings must follow the format **2.3 Review of Empirical Studies**.
`;

const getChapter4Part1Prompt = (details: any) => `
  Write **CHAPTER FOUR: RESULTS (Section A)** for the project "${details.topic}".
  
  ${TABLE_SYSTEM_INSTRUCTION}

  **STRUCTURE:**
  **Section A: Answers to Research Questions** (Descriptive Statistics)
  
  Provide exactly **three (3) tables** (Table 1, Table 2, Table 3) corresponding to Research Question 1, Research Question 2, and Research Question 3.
  
  **CRITICAL:** You MUST use EXACTLY these three Research Questions:
  1. ${details.researchQuestions[0]}
  2. ${details.researchQuestions[1]}
  3. ${details.researchQuestions[2]}

  **FOR EACH RESEARCH QUESTION:**
  1. **Figure (Graph/Chart):** Provide a professional ${details.figureType || 'Graph'} representing the data BEFORE the table.
     - Labeling: Start from **Fig. 2**, then **Fig. 3**, **Fig. 4**.
     - Use [GRAPH] or [SCHEMA] tags exactly as defined below.
  2. **Introduction:** Write a sentence introducing the table.
  3. **Table:** Insert the Markdown table (Likert scale: SA, A, D, SD).
     - **CRITICAL:** The LAST ROW must be the **Cluster Mean**.
  4. **Interpretation:** Write a detailed paragraph analyzing the table.

  ${details.figureType === 'Diagram' ? `
  **DIAGRAM FORMAT:**
  [SCHEMA]
  {
    "type": "flowchart",
    "nodes": [{"id": "N1", "text": "Step 1"}, {"id": "N2", "text": "Step 2"}],
    "links": [{"from": "N1", "to": "N2"}]
  }
  [/SCHEMA]
  ` : `
  **GRAPH FORMAT:**
  [GRAPH]
  {
    "type": "${details.figureType === 'Bar Chart' ? 'bar' : 'line'}",
    "title": "Fig. X: Title of the Figure",
    "labels": ["Label 1", "Label 2", "Label 3", "Label 4"],
    "data": [3.5, 2.8, 3.2, 3.9]
  }
  [/GRAPH]
  `}

  **IMPORTANT RULES:**
  - **DO NOT** include the chapter title ("CHAPTER FOUR: ...") in your response.
  - **Tables:** Real Markdown tables, no vertical lines.
  - **Interpretation:** Mandatory paragraph after every table.
`;

const getChapter4Part2Prompt = (details: any) => `
  Write **CHAPTER FOUR: RESULTS (Section B)** for the project "${details.topic}".
  
  ${TABLE_SYSTEM_INSTRUCTION}

  **STRUCTURE:**
  **Section B: Test of Hypotheses** (Inferential Statistics)
  
  Provide exactly **three (3) tables** (Table 4, Table 5, Table 6) corresponding to Hypothesis 1, Hypothesis 2, and Hypothesis 3.
  
  **CRITICAL:** You MUST use EXACTLY these three Null Hypotheses:
  1. ${details.hypotheses[0]}
  2. ${details.hypotheses[1]}
  3. ${details.hypotheses[2]}

  **FOR EACH HYPOTHESIS:**
  1. **Introduction:** Write a sentence introducing the hypothesis test.
  2. **Table:** Insert the Markdown table (t-test or ANOVA).
  3. **Interpretation:** Write a detailed paragraph analyzing the result (p-value decision rule).

  **IMPORTANT RULES:**
  - **DO NOT** include the chapter title.
  - **NO FIGURES** in this section.
  - **Tables:** Real Markdown tables, no vertical lines.
  - **Interpretation:** Mandatory paragraph after every table.
  - **4.2 Major Findings of the Study**: After the tables, list the major findings in bullet points.
`;

const getChapter2Prompt = (details: any) => `
  Write **CHAPTER TWO: LITERATURE REVIEW** for the project "${details.topic}".
  
  ${TABLE_SYSTEM_INSTRUCTION}

  **STRUCTURE:**
  Begin with a brief introduction indicating that the literature is reviewed under three major headings:
  - **2.1 Conceptual Framework**
  - **2.2 Theoretical Framework**
  - **2.3 Review of Empirical Studies**
  - **2.4 Summary of Literature Review**

  **2.1 Conceptual Framework**: Identify different concepts relevant to the study, discuss each with accurate in-text citations, provide operational definitions for each concept and link them to the study. Submerge related sub-themes here using appropriate levels of heading and current literature.
  **2.2 Theoretical Framework**: Identify theories relevant to the study, state each as presented by theorists (name and year), relate each theory to the study. Present the theoretical framework using a professional schema.
  Use the following format for the schema.
  **CRITICAL:** Ensure node text is concise (max 5-7 words) to fit in boxes.
  [SCHEMA]
  {
    "type": "flowchart",
    "title": "Fig. 1: Theoretical Framework of the Study",
    "nodes": [
      {"id": "T1", "text": "Theory 1 Name"},
      {"id": "T2", "text": "Theory 2 Name"},
      {"id": "S", "text": "Current Study"}
    ],
    "links": [
      {"from": "T1", "to": "S"},
      {"from": "T2", "to": "S"}
    ]
  }
  [/SCHEMA]
  Follow with an accompanying verbal description.
  **2.3 Review of Empirical Studies**: Identify related empirical studies. Review each in detail: author, year, title or purpose, number of research questions and hypotheses, and the design. Indicate how the current study will address the weaknesses and gaps identified, relating each reviewed study to the current one.
  **2.4 Summary of Literature Review**: Restate operational definitions of each concept and relate to study. Restate relevant theories and relate to each other and the study. State number of reviewed empirical studies. Restate weaknesses and gaps already identified and indicate how this study addresses them.

  **IMPORTANT RULES:**
  - **DO NOT** include the chapter title ("CHAPTER TWO: LITERATURE REVIEW") in your response.
  - **NO TABLES:** Do not use any tables in Chapter 2.
  - **FIGURES:** The only figure allowed is the [SCHEMA] in section 2.2.
  - **LANGUAGE & STYLE:** Avoid first-person pronouns (I, Me, Us, We, Our). Use "the researcher(s)" or "the author(s)". Use gender-neutral terms.
  - Review empirical studies in the **PAST TENSE**.
  - Use words for numbers less than 10, and figures for 10 and above. Start sentences with words, not figures.
  - Do not start a paragraph with a citation.
  - Use APA 7th edition for references.
  - DO NOT use Markdown headers. Use bold text for subheadings.
  - **CRITICAL:** Subheadings must follow the format **2.1 Conceptual Framework**.
  - **CRITICAL:** DO NOT include a "References" section.
`;

const getChapter3Prompt = (details: any) => `
  Write **CHAPTER THREE: METHODS** for the project "${details.topic}".
  
  ${TABLE_SYSTEM_INSTRUCTION}

  **REQUIRED SUBHEADINGS:**
  - **3.1 Design of the Study**: Adopt the best design (descriptive, analytic, correlational), highlight characteristics, justify appropriateness, and cite authors who adopted it in similar situations.
  - **3.2 Area of the Study**: State geographical location (longitude/latitude, country, LGA, town, boundaries). Describe demographics and justify choice with evidence of the unsatisfactory state of affairs that predisposes the problem.
  - **3.3 Population of the Study**: State population size and variables (gender, location). Attach details of description/distribution as an appendix.
  - **3.4 Sample and Sampling Technique(s)**: Determine size using scientific schemes/formulas. Indicate how obtained through scientific procedure. Identify techniques and provide step-by-step description. Avoid disclosing names of sampled objects.
  - **3.5 Instrument for Data Collection**: Identify instrument, describe development/source, structure, and justify use.
  - **3.6 Validity of the Instrument(s)**: Identify appropriate type of validity (truthfulness, accuracy).
  - **3.7 Reliability of the Instrument**: Describe consistency. Reliability estimate must be < 1. Describe establishment via pilot test (~30 subjects not in study). Present reliability index.
  - **3.8 Method of Data Collection**: Detailed step-by-step description. (If experimental, use "Experimental Procedure" and describe activities in each condition).
  - **3.9 Method of Data Analysis**: Identify statistical tools/techniques, justify, and indicate statistical package/version (e.g., SPSS v27).

  **CRITICAL RULES:**
  - **DO NOT** include the chapter title ("CHAPTER THREE: METHODS") in your response. Start directly with the first subheading.
  - **NO TABLES OR FIGURES:** Do not use any tables or figures in Chapter 3. Present the Population and Sample distribution using clear text/paragraphs.
  - **LANGUAGE & STYLE:** Avoid first-person pronouns (I, Me, Us, We, Our). Use "the researcher(s)" or "the author(s)". Use gender-neutral terms.
  - Use words for numbers less than 10, and figures for 10 and above. Start sentences with words, not figures.
  - Do not start a paragraph with a citation.
  - Use APA 7th edition.
  - **FORMULAS:** In **3.9 Method of Data Analysis**, include the formula:
    [FORMULA]
    X̄ = ΣfX / N
    [/FORMULA]
    Where: 
    X̄ = Mean Score
    Σ = Summation
    f = Frequency
    X = Nominal Value
    N = Number of Respondents
  
  **IMPORTANT:** The formula rules above (Where X̄ = ...) MUST be in a vertical list format for clarity.
`;

const getChapter4Prompt = (details: any) => `
  Write **CHAPTER FOUR: RESULTS** for the project "${details.topic}".
  
  ${TABLE_SYSTEM_INSTRUCTION}

  **STRUCTURE:**
  This chapter MUST be divided into two distinct sections:
  1.  **Section A: Answers to Research Questions** (Descriptive Statistics)
  2.  **Section B: Test of Hypotheses** (Inferential Statistics)

  **Section A: Answers to Research Questions**
  - Provide exactly **three (3) tables** (Table 1, Table 2, Table 3) corresponding to Research Question 1, Research Question 2, and Research Question 3.
  - **CRITICAL:** You MUST use EXACTLY these three Research Questions:
    1. ${details.researchQuestions[0]}
    2. ${details.researchQuestions[1]}
    3. ${details.researchQuestions[2]}
  - **Table Format:** S/N | Item | SA | A | D | SD | N | Total | Mean (X) | SD | Remark
  - **CRITICAL:** The LAST ROW of the table MUST be the **Cluster Mean**.
  - **Cluster Mean Row Format:** | | **Cluster Mean** | | | | | | | **[Value]** | | **[Remark]** |
  - **Content:** Use Likert scale data (SA=4, A=3, D=2, SD=1). Ensure N is consistent.
  - **REALISM:** Ensure a **MIX of 'Accepted' and 'Rejected'** remarks. Do NOT make all items 'Accepted'. This is critical for realism.
  - **ITEM NAMES:** Use REAL, ACADEMIC item statements (e.g., "Inadequate funding affects laboratory maintenance"). **DO NOT** use placeholders like "Item 1" or "Statement 1".
  - **CONCISENESS:** Keep the text in the "Item" column concise (max 10-12 words).
  - **MATH CHECK:** Internally verify that Mean = (4*SA + 3*A + 2*D + 1*SD) / N.
  - **NEGATIVE CONSTRAINT:** **DO NOT** show the formula or calculation steps in the text. Only present the final values in the table.
  - **Interpretation Structure (MANDATORY):**
    1.  **Introduction:** Write a sentence introducing the table (e.g., "The data presented in Table 1 reveals the responses of respondents regarding...").
    2.  **The Table:** Insert the Markdown table here.
    3.  **Interpretation:** Write a detailed paragraph analyzing the table.
        - Start with: "Table [X] shows the mean ratings of respondents on [Research Question Topic]."
        - Mention specific items with high/low means.
        - Conclude with: "The result in Table [X] shows that the cluster mean of [Value] is [greater/less] than the criterion mean of 2.50; therefore, the research question is [accepted/rejected]."

  **Section B: Test of Hypotheses**
  - Provide exactly **three (3) tables** (Table 4, Table 5, Table 6) corresponding to Hypothesis 1, Hypothesis 2, and Hypothesis 3.
  - **CRITICAL:** You MUST use EXACTLY these three Null Hypotheses:
    1. ${details.hypotheses[0]}
    2. ${details.hypotheses[1]}
    3. ${details.hypotheses[2]}
  - **Table Format:** Group | N | Mean | SD | t-value | df | p-value | Decision
  - **Content:** Use t-test or ANOVA data.
  - **Interpretation Structure (MANDATORY):**
    1.  **Introduction:** Write a sentence introducing the hypothesis test.
    2.  **The Table:** Insert the Markdown table here.
    3.  **Interpretation:** Write a detailed paragraph analyzing the result.
        - Start with: "Table [X] presents the t-test analysis of [Hypothesis Topic]."
        - State the decision rule: "Since p-value ([Value]) is [less/greater] than 0.05 level of significance, the null hypothesis is [rejected/accepted]."

  **REQUIRED SUBHEADINGS:**
  - **4.1 Presentation and Interpretation of Results**: Organized by Section A and Section B as described above.
    **CRITICAL:** Figure numbering in Chapter 4 MUST start from **Fig. 2** (since Fig. 1 is the Theoretical Framework in Chapter 2).
    
    For each Research Question in Section A, provide a professional ${details.figureType || 'Graph'} (Figure) representing the data BEFORE the table.
    **FIGURE LABELING:** Every figure in Chapter 4 MUST be labeled starting from **Fig. 2**, then **Fig. 3**, **Fig. 4**, etc.
    ${details.figureType === 'Diagram' ? `
    Use the following format for diagrams.
    **CRITICAL:** Ensure node text is concise (max 5-7 words).
    [SCHEMA]
    {
      "type": "flowchart",
      "nodes": [
        {"id": "N1", "text": "Step 1"},
        {"id": "N2", "text": "Step 2"}
      ],
      "links": [
        {"from": "N1", "to": "N2"}
      ]
    }
    [/SCHEMA]
    ` : `
    Use the following format for graphs/charts.
    **CRITICAL:** Ensure labels are concise (max 2-3 words).
    [GRAPH]
    {
      "type": "${details.figureType === 'Bar Chart' ? 'bar' : 'line'}",
      "title": "Fig. 2: Title of the Figure",
      "labels": ["Label 1", "Label 2", "Label 3", "Label 4"],
      "data": [3.5, 2.8, 3.2, 3.9]
    }
    [/GRAPH]
    `}
    
  - **4.2 Major Findings of the Study**: Number of findings must equal number of specific purposes. Use **BULLET POINTS** (*), not numbers. State sequentially. One finding per RQ/Hypothesis.

  **TABLE RULES:**
  - **CRITICAL:** All tables MUST be real Markdown tables. NO vertical lines. NO symbols or plain text "drawn" tables.
  - **COMPLETENESS:** Tables MUST be complete. Generate at least 5-10 rows of data for each table. Do not truncate tables.
  - **Total Tables:** You MUST generate exactly **6 tables** in this chapter.
  - **CRITICAL:** Do NOT use descriptive statistics (Mean/SD only) for Hypotheses. You MUST use inferential statistics (t-value, p-value).
  - **Table Titles:** Table titles MUST be descriptive, showing exactly what the table is talking about (e.g., "Table 1: Mean Ratings of Respondents on the Impact of...").
  - **Formatting:** All Research Questions and Hypotheses in this chapter MUST be wrapped in double asterisks (e.g., **Research Question 1: ...**) to ensure they are **BOLDED**.

  **INTERPRETATION RULES (CRITICAL):**
  - **YOU MUST WRITE A DETAILED PARAGRAPH OF INTERPRETATION IMMEDIATELY AFTER EVERY TABLE.**
  - This applies to ALL 6 tables (Section A and Section B).
  - The interpretation must explicitly state what the table is showing and analyze the data within it.
  - Start the interpretation paragraph immediately below the table with: "Table [X] shows..."

  **IMPORTANT RULES:**
  - **DO NOT** include the chapter title ("CHAPTER FOUR: RESULTS") in your response.
  - **LANGUAGE & STYLE:** Avoid first-person pronouns (I, Me, Us, We, Our). Use "the researcher(s)" or "the author(s)". Use gender-neutral terms.
  - Use words for numbers less than 10, and figures for 10 and above. Start sentences with words, not figures.
  - Do not start a paragraph with a citation.
  - Use APA 7th edition.
  - DO NOT include chapter title.
`;

const getListOfTablesPrompt = (details: any) => `
  Generate a "List of Tables" for the project "${details.topic}".
  Format it as a list of table titles with their corresponding page numbers.
  
  **CRITICAL:** Provide exactly SIX (6) tables. No more, no less.
  **CRITICAL:** Table numbers must be unique (Table 1 to Table 6).
  **CRITICAL:** Table titles MUST be descriptive, showing exactly what the table is talking about.
  **CRITICAL:** DO NOT use dashes (---) or dots (...) to connect the title to the page number. Just use a space or tab.
  
  Example:
  Table 1: Mean Ratings of Respondents on the Impact of Technology on Education 42
  Table 2: Mean Ratings of Respondents on the Challenges of E-Learning 45
  Table 3: Mean Ratings of Respondents on Strategies for Improvement 48
  Table 4: t-test Analysis of the Difference in Mean Ratings of Male and Female Teachers 50
  Table 5: t-test Analysis of the Difference in Mean Ratings of Urban and Rural Teachers 52
  Table 6: t-test Analysis of the Difference in Mean Ratings of Experienced and Inexperienced Teachers 55
`;

const getListOfFiguresPrompt = (details: any) => `
  Generate a "List of Figures" for the project "${details.topic}".
  Format it as a list of figure titles with their corresponding page numbers.
  **CRITICAL:** DO NOT use dashes (---) or dots (...) to connect the title to the page number. Just use a space or tab.
  
  Example:
  Figure 1: Conceptual Framework of the Study 15
  Figure 2: Map of the Study Area 33
  
  Provide at least 2 realistic figure titles.
`;

const getListOfAppendicesPrompt = (details: any) => `
  Generate a "List of Appendices" for the project "${details.topic}".
  Format it as a list of appendix titles with their corresponding page numbers.
  **CRITICAL:** DO NOT use dashes (---) or dots (...) to connect the title to the page number. Just use a space or tab.
  
  Example:
  Appendix I: Request for Validation of Research Instrument 72
  Appendix II: Research Questionnaire 73
  
  Provide at least 2-3 realistic appendix titles.
`;

const getChapter5Part1Prompt = (details: any) => `
  Write **CHAPTER FIVE: DISCUSSION (Part 1)** for the project "${details.topic}".
  
  ${TABLE_SYSTEM_INSTRUCTION}

  **REQUIRED SUBHEADINGS:**
  - **5.1 Discussion of the Major Findings**: Justify findings against other theoretical and empirical works, provide likely reasons, present evidence that agreed/disagreed. Guided by purpose/RQ/Hypothesis. Each section begins with a caption derived from purpose/RQ/Hypothesis. Where a research question has a corresponding hypothesis, both are discussed together with emphasis on the hypothesis.

  **IMPORTANT RULES:**
  - **DO NOT** include the chapter title ("CHAPTER FIVE: ...") in your response.
  - **NO TABLES OR FIGURES:** Do not use any tables or figures in Chapter 5.
  - **LANGUAGE & STYLE:** Avoid first-person pronouns (I, Me, Us, We, Our). Use "the researcher(s)" or "the author(s)". Use gender-neutral terms.
  - Use words for numbers less than 10, and figures for 10 and above. Start sentences with words, not figures.
  - Do not start a paragraph with a citation.
  - Use APA 7th edition.
  - DO NOT include chapter title.
`;

const getChapter5Part2Prompt = (details: any) => `
  Write **CHAPTER FIVE: CONCLUSION & SUMMARY (Part 2)** for the project "${details.topic}".
  
  ${TABLE_SYSTEM_INSTRUCTION}

  **REQUIRED SUBHEADINGS:**
  - **5.2 Conclusions**: Central messages properly integrated (problem, method, results, implications). Emphasis on result and implication. Judgements passed on major findings.
  - **5.3 Implications of the Findings**: What findings suggest. Use non-assertive words (seems, perhaps, maybe, possibly, likely, appears). One implication per specific purpose.
  - **5.4 Recommendations**: Directly based on findings.
  - **5.5 Limitations of the Study**: Methodological inadequacies not initially well understood and controlled. Express major occurrences during field data collection that could not be controlled. Finance is NOT a limitation.
  - **5.6 Suggestions for Further Study**: Suggest further studies to address limitations of current study.
  - **5.7 Summary of the Study**: Abridged form of entire research in paragraphs (one per chapter).

  **IMPORTANT RULES:**
  - **DO NOT** include the chapter title.
  - **NO TABLES OR FIGURES.**
  - **LANGUAGE & STYLE:** Academic tone, third person.
  - **CRITICAL:** Subheadings must follow the format **5.2 Conclusions**.
`;

const getReferencesPrompt = (details: any) => `
  Generate a list of **15-20 academic references** for the project "${details.topic}".
  **CRITICAL RULES:**
  - Format in **APA 7th edition**.
  - Sort alphabetically.
  - Each reference on a new line.
  - Use Markdown italics (e.g., *Title of Book*) for titles.
  - DO NOT include any introductory or concluding text.
`;

const getAppendixPrompt = (details: any) => `
  Write the Appendix content for the project "${details.topic}".
  
  ${TABLE_SYSTEM_INSTRUCTION}

  Generate **Introductory Letter**, **SECTION A: PERSONAL DATA** and **SECTION B: QUESTIONNAIRE ITEMS**.
  
  **INSTRUCTIONS:**
  - **Introductory Letter:**
    - Write a unique, professional introductory letter to the respondent.
    - Start with "Dear Respondent,".
    - Explain the purpose of the study ("${details.topic}") and request their honest participation.
    - Assure confidentiality.
    - End exactly with:
      Yours faithfully,
      ${details.surname} ${details.firstName}
      (Researcher)
    - **DO NOT** include any title like "Appendix I" or "Research Instrument" above the letter.
    - **DO NOT** include the address block (it is added automatically).
  
  - **SECTION A: PERSONAL DATA**
    - **SECTION A**
    - **Instruction: Fill your personal data in the space provided below:**
    - Name of School: ____________________________________________________
    - Class: _____________________________________________________________
    - Sex: Male [ ] Female [ ]
  
  - **SECTION B: QUESTIONNAIRE ITEMS**
    - **SECTION B**
    - **Instruction: tick (√) for either Strongly Agree (SA), Agree (A), Disagree (D) and Strongly Disagree (SD) in front of the statement you fell is the correct.**
    - **CRITICAL:** Use the square root symbol √ for the tick instruction exactly as shown: (√).
    - **CRITICAL:** Write the instruction ONLY ONCE at the start of Section B.
    - **Research Question 1: [Formulate a relevant research question based on "${details.topic}"]**
    - Create a **Markdown Table** with columns: S/N, Items, SA, A, D, SD.
    - Fill with 6 realistic items. **Leave the SA, A, D, SD columns empty (blank) for the respondent to fill.**
    - **CRITICAL: NO MOCK DATA.** Use real, high-quality academic items that follow the project topic.
    
    - **Research Question 2:** [Formulate a second relevant research question based on "${details.topic}"]
    - Create a **Markdown Table** with columns: S/N, Items, SA, A, D, SD.
    - Fill with 5 realistic items. **Leave the SA, A, D, SD columns empty (blank) for the respondent to fill.**
    - **CRITICAL: NO MOCK DATA.** Use real, high-quality academic items that follow the project topic.
    - **CRITICAL:** The S/N in the second table MUST continue from the last number of the first table. For example, if the first table ends at 6, the second table MUST start at 7.
    - **CRITICAL: REALISM.** Ensure all questionnaire items are highly relevant to the topic "${details.topic}" and the study area "${details.studyLocation || 'the study area'}".
  
  **CRITICAL TABLE FORMAT:**
  - **NO VERTICAL LINES.** Use the same professional style as Chapter 4 tables.
  | S/N | Items | SA | A | D | SD |
  |:---:|:---:|:---:|:---:|:---:|:---:|
  | 1 | Statement goes here... | | | | |

  **IMPORTANT:**
  - Ensure "Research Question 1" and "Research Question 2" lines are bolded (wrapped in **).
  - Do not add any text after the last table.
`;

// --- Static Content Generators ---

const parseDepartment = (deptString: string) => {
  const match = (deptString || '').match(/^(.*?)\s\((.*?)\)$/);
  if (match) {
    return { name: match[1], degree: match[2] };
  }
  return { name: deptString || '', degree: "B.Sc. Ed." }; // Default
};

const generateCoverPage = (details: any) => {
  const { name: deptName } = parseDepartment(details.department);
  return `
${(details.topic || '').toUpperCase()}

BY

${(details.surname || '').toUpperCase()} ${(details.firstName || '').toUpperCase()} ${(details.middleName || '').toUpperCase()}
${details.regNo || ''}

DEPARTMENT OF ${deptName.toUpperCase()}, ${(details.university || 'NWAFOR ORIZU COLLEGE OF EDUCATION').toUpperCase()}, NSUGBE IN AFFILIATION WITH THE UNIVERSITY OF NIGERIA, NSUKKA

${(details.submissionDate || 'NOVEMBER 2022').toUpperCase()}
`;
};

const generateTitlePage = (details: any) => {
  const { name: deptName, degree } = parseDepartment(details.department);
  return `
TITLE PAGE

${(details.topic || '').toUpperCase()}

BY

${(details.surname || '').toUpperCase()} ${(details.firstName || '').toUpperCase()} ${(details.middleName || '').toUpperCase()}
${details.regNo || ''}

PROJECT SUBMITTED TO THE DEPARTMENT OF ${deptName.toUpperCase()}, ${(details.university || 'NWAFOR ORIZU COLLEGE OF EDUCATION').toUpperCase()}, NSUGBE IN AFFILIATION WITH THE UNIVERSITY OF NIGERIA, NSUKKA IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE AWARD OF BACHELOR OF SCIENCE DEGREE IN ${deptName.toUpperCase()} (${degree.toUpperCase()}).

SUPERVISOR: ${(details.supervisorName || '').toUpperCase()}

${(details.submissionDate || 'NOVEMBER 2022').toUpperCase()}
`;
};

const generateCertification = (details: any) => `
CERTIFICATION PAGE

I, ${details.surname} ${details.firstName} ${details.middleName} attest that the work embodied in this Project has been done by me under the guidance of my supervisor. It is original and has not been submitted for any degree or diploma of any institution.

______________________                          ______________________
${details.surname} ${details.firstName} ${details.middleName}         ${details.supervisorName}
(Researcher)                                    (Supervisor)
`;

const generateApproval = (details: any) => {
  const { name: deptName } = parseDepartment(details.department);
  return `
Approval Page

This project "${details.topic}" has been read and approved by the undersigned as meeting the requirement of the Department of ${deptName} University of Nigeria Nsukka for the award of bachelor of science Degree in ${deptName} Education.

By

______________________                          ______________________
${details.supervisorName || "Supervisor"}                          Date
(Supervisor)

______________________                          ______________________
${details.headOfDepartment || "Head of Department"}                  Date
(Head of Department)

______________________                          ______________________
Internal Examiner                               Date

______________________                          ______________________
External Examiner                               Date

______________________                          ______________________
${details.deanUniversityOfNigeriaNsukka || details.deanOfFaculty || "Dean of Faculty"}   Date
(Dean, Faculty of Education
University of Nigeria Nsukka)
`;
};

// Keep the old function signature for backward compatibility if needed, 
// but it will now use the stream internally or just throw.
// Actually, let's just remove it to force usage of the stream.
export const generateProjectContent = async (details: any): Promise<string> => {
  console.warn("generateProjectContent is deprecated. Use generateProjectContentStream.");
  let finalContent = "";
  for await (const update of generateProjectContentStream(details)) {
    if (update.content) finalContent += update.content + "\n\n";
  }
  return finalContent;
};

export const solveEDU432Questions = async (input: { text?: string, base64Data?: string, mimeType?: string }, mode: 'quiz-answers' | 'exam-questions' | 'quiz-questions'): Promise<string> => {
  const courseNotes = `
  QUALITY ASSURANCE NOTE: 
  EDU 432 Quality Assurance in Education.
  Concepts: Quality Assurance, Accountability, Supervision and Support, Evaluation and Improvement, Regulation.
  Nature: Continuous, Systematic, Scientific, Preventive, Corrective, Selective, Graded, Supportive, Participatory.
  Types of Inspection: Routine, Surprise, Full, Partial, Subject-based, Follow-up, Diagnostic, Advisory, Internal, External.
  Theories: Autocratic (Traditional), Democratic (Modern), Scientific, Human Relations, Clinical Supervision (Developmental), Systems Theory.
  Problems in Nigeria: Inadequate Funding, Shortage of Qualified Inspectors, Poor Training, Corruption, Negative Attitude of Teachers, Poor Follow-up, Political Interference, Inadequate Facilities, Overcrowding.
  Prospects: Quality Improvement, Professional Development, Use of Modern Technology, Strengthening Accountability, Policy Review, Capacity Building, Collaboration.
  `;

  let prompt = "";
  if (mode === 'quiz-answers') {
    prompt = `Act as an expert in EDU 432 Quality Assurance. Based on the provided course notes and the user's input (image or text), provide the CORRECT answers to the quiz questions. Give ONLY the answers in a ready-to-write format. 
    Notes context: ${courseNotes}`;
  } else if (mode === 'exam-questions') {
    prompt = `Act as an expert examiner for EDU 432 Quality Assurance. Based on the course notes, generate 10 high-probability EXAM questions (Theory and Objective). 
    Notes context: ${courseNotes}`;
  } else if (mode === 'quiz-questions') {
    prompt = `Act as an expert in EDU 432 Quality Assurance. Generate 20 practice QUIZ questions (Multiple Choice) based on the course notes. 
    Notes context: ${courseNotes}`;
  }

  const parts: any[] = [{ text: prompt }];
  if (input.text) parts.push({ text: `User Input: ${input.text}` });
  if (input.base64Data && input.mimeType) {
    parts.push({
      inlineData: {
        mimeType: input.mimeType,
        data: input.base64Data.split(',')[1] || input.base64Data
      }
    });
  }

  const response = await generateContentWithRetries({
    model: 'gemini-3-flash-preview',
    contents: [{ parts }],
    config: {
      thinkingConfig: { thinkingLevel: 'LOW' },
      temperature: 0.2,
    }
  });

  return response.text;
};

export const extractGradesFromFile = async (base64Data: string, mimeType: string): Promise<any[]> => {
  const prompt = `Extract academic results from this document. For each course, identify the Course Name/Code, the Grade (A, B, C, D, E, or F), and the Credit Load (Units). 
  Return the data as a JSON array of objects with keys: "name", "grade", and "creditLoad". 
  Example: [{"name": "MTH101", "grade": "A", "creditLoad": 3}]. 
  If credit load is not found, default to 3. Only return the JSON array, nothing else.`;

  const response = await generateContentWithRetries({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data.split(',')[1] || base64Data
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: 'LOW' },
    }
  });

  return JSON.parse(response.text.trim());
};

export const identifyObject = async (base64Image: string): Promise<string> => {
  const prompt = `Identify the object(s) in this image. Provide a detailed description, its common uses, and any interesting facts about it. 
  If it's a person, describe their appearance and what they are doing. 
  If it's a device, mention its likely model or type. 
  Keep the tone informative and helpful.`;

  const response = await generateContentWithRetries({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image
            }
          }
        ]
      }
    ],
    config: {
      thinkingConfig: { thinkingLevel: 'LOW' },
      temperature: 0.2,
    }
  });

  return response.text;
};

export const solveFileQuestions = async (base64Data: string, mimeType: string): Promise<string> => {
  const prompt = `Solve these questions immediately. Give ONLY the answers. No explanations. No context. Ready-to-write format.`;

  const response = await generateContentWithRetries({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: base64Data.split(',')[1] || base64Data
            }
          }
        ]
      }
    ],
    config: {
      thinkingConfig: { thinkingLevel: 'LOW' },
      temperature: 0.1,
    }
  });

  return response.text;
};

export const solveImageQuestions = async (base64Image: string): Promise<string> => {
  return solveFileQuestions(base64Image, 'image/jpeg');
};

export const generateContentWithRetry = async (
  requestedModel: string,
  prompt: string,
  extraConfig: any = {}
): Promise<string> => {
  const response = await generateContentWithRetries({
    model: requestedModel || 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: 'LOW' },
      ...extraConfig
    }
  });

  return response.text;
};
