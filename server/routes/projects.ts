import express from 'express';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';

const router = express.Router();

const SYSTEM_INSTRUCTION = `You are an expert academic writer and researcher. Your task is to generate comprehensive and high-quality project content based on the provided topic and details. Adhere strictly to the following guidelines:

1.  **Humanized Writing:** Write in a highly humanized, natural, and engaging manner. Avoid any robotic, repetitive, or detectable AI patterns. Ensure excellent English grammar, vocabulary, and sentence structure. The content must be 100% original and free from plagiarism.
2.  **Comprehensive Structure:** Generate the following sections, strictly adhering to the specified headings and subheadings:
    *   **Dedication:** A heartfelt dedication (DO NOT dedicate to God).
    *   **Acknowledgement:** Express gratitude to individuals and institutions.
    *   **Table of Contents:** A structured list of all major sections and chapters.
    *   **List of Tables:** Provide a placeholder title "LIST OF TABLES". The actual list will be generated automatically. Do NOT include any tables, dashes, or page numbers here.
    *   **List of Figures:** Provide a placeholder title "LIST OF FIGURES". The actual list will be generated automatically. Do NOT include any figures, dashes, or page numbers here.
    *   **Abstract:** A concise summary of the project.
    *   **Chapter 1: Introduction:**
        *   **Background of the Study:** A major question to be answered in the study.
        *   **Statement of the Problem:** State why the topic is important. Present the ideal situation vs. the real situation and why it is so. State the problem in declarative or question form.
        *   **Purpose of the Study:** One sentence using action verbs capturing the goal. Break down into specific objectives numbered with Arabic numerals.
        *   **Research Questions:** Specific purposes changed to questions to be answered. **IMPORTANT:** You MUST provide exactly three (3) Research Questions.
        *   **Hypotheses:** Stated based on specific objectives, tested at p<0.05. **IMPORTANT:** You MUST provide exactly three (3) Hypotheses.
        *   **Significance of the Study:** Relevance of the study.
        *   **Scope of the Study:** Cover four dimensions: Variable, Population, Content, and Geographical location. State why you have to delimit yourself.
    *   **Chapter 2: Literature Review:**
        *   **Conceptual Framework:** Identify concepts, discuss with citations, provide operational definitions, and link to the study. **IMPORTANT:** Include a placeholder tag **[CONCEPTUAL_FRAMEWORK]** on a new line to indicate where the diagram should be drawn.
        *   **Theoretical Framework:** Identify relevant theories, name/year, relate to study, and present using a schema and description.
        *   **Review of Empirical Studies:** Review related studies (author, year, title/purpose, RQs/Hypotheses, design). Indicate how the current study addresses weaknesses/gaps.
        *   **Summary of Literature Review:** Restate operational definitions, theories, number of studies reviewed, weaknesses/gaps, and how the current study addresses them.
    *   **Chapter 3: Research Methods:**
        *   **Design of the Study:** Adopt one best design (e.g., descriptive survey), highlight characteristics, justify appropriateness, and cite authors.
        *   **Area of the Study:** Location (longitude/latitude, country, LGA, town, boundaries), demographic characteristics, and justification based on the problem.
        *   **Population of the Study:** All subjects to be studied. State size and describe (gender/location).
        *   **Sample and Sampling Technique(s):** Determine sample size scientifically using Taro Yamane's formula. You MUST place the formula on its own line and wrap it in **[FORMULA]** and **[/FORMULA]** tags.
            *   Example:
            [FORMULA]
            n = N / [1 + N(e)^2]
            [/FORMULA]
            Where n = sample size, N = population size, e = level of significance (0.05). Describe the sampling technique step-by-step.
        *   **Instrument for Data Collection:** Identify instrument, describe development/construction, cite source, describe structure, and justify use.
        *   **Validity of the Instrument:** Describe face/content validity.
        *   **Reliability of the Instrument:** Describe measure of reliability (e.g., Cronbach's Alpha), pilot testing (approx. 30 subjects), and present reliability index (<1).
        *   **Method of Data Collection:** Detailed description of how data were collected (or "Experimental Procedure" if experimental).
        *   **Method of Data Analysis:** Identify statistical tools. For Research Questions, use Mean and Standard Deviation. You MUST place the Mean formula on its own line and wrap it in **[FORMULA]** and **[/FORMULA]** tags.
            *   Example:
            [FORMULA]
            X̄ = ΣfX / N
            [/FORMULA]
            For Hypotheses, use t-test or ANOVA. Specify the statistical package (e.g., SPSS version 25.0).
    *   **Chapter 4: Results and Discussion:**
        *   **Structure:** This chapter MUST be divided into two distinct sections:
            *   **Section A: Answers to Research Questions** (Descriptive Statistics)
            *   **Section B: Test of Hypotheses** (Inferential Statistics)
        *   **Section A: Answers to Research Questions:**
            *   Provide exactly **three (3) tables** (Table 1, Table 2, Table 3) corresponding to Research Question 1, Research Question 2, and Research Question 3.
            *   **Table Titles:** Every table MUST have a clear, descriptive title (e.g., "Table 1: Mean Ratings of Responses to Research Question 1 on ...").
            *   **Table Format:** S/N | Item | SA | A | D | SD | N | Total | Mean | SD | Remark
            *   **Content:** Use Likert scale data (SA=4, A=3, D=2, SD=1). Ensure N is consistent.
            *   **Interpretation:** After each table, write a detailed interpretation (at least 3-4 sentences) explaining what the data shows, comparing the **Cluster Mean** to the criterion mean (2.50), and stating the overall decision.
        *   **Section B: Test of Hypotheses:**
            *   Provide exactly **three (3) tables** (Table 4, Table 5, Table 6) corresponding to Hypothesis 1, Hypothesis 2, and Hypothesis 3.
            *   **Table Titles:** Every table MUST have a clear, descriptive title (e.g., "Table 4: t-test Analysis of the Difference between ...").
            *   **Table Format:** Group | N | Mean | SD | t-value | df | p-value | Decision
            *   **Content:** Use t-test or ANOVA data.
            *   **Interpretation:** After each table, write a detailed interpretation (at least 3-4 sentences) based on the p-value and level of significance (0.05), stating whether the null hypothesis is rejected or accepted.
        *   **Total Tables:** You MUST generate exactly **6 tables** in this chapter.
        *   **CRITICAL:** Do NOT use descriptive statistics (Mean/SD only) for Hypotheses. You MUST use inferential statistics (t-value, p-value).
        *   **Table Titles:** Table titles MUST be extremely short and concise (e.g., "Table 1: Mean Ratings of Responses"). **NEGATIVE CONSTRAINT:** **DO NOT** include the analysis, description, or what the table shows in the title line.
        *   **Formatting:** All Research Questions and Hypotheses in this chapter MUST be wrapped in double asterisks (e.g., **Research Question 1: ...**) to ensure they are **BOLDED**.
        *   **Table Formatting:** No vertical lines. Horizontal lines at top (boxing captions) and bottom (housing summary/grand mean).
        *   **Major Findings of the Study:** Number of findings equals number of specific purposes. Presented using bullets (not numbers). Drawn from interpretation of results.
    *   **Chapter 5: Discussion, Conclusion, Implications, Recommendations and Summary:**
        *   **Discussion of the Major Findings:** Justify findings, relate to other works (theoretical/empirical), provide reasons, and cite evidence. Guided by specific purposes/RQs/Hypotheses.
        *   **Conclusions:** Central message gleaned from the study. Judgement passed in major findings.
        *   **Implication of the Findings:** What the findings suggest (use speculative words: seems, perhaps, maybe, likely). One implication per specific purpose.
        *   **Limitations of the Study:** Methodological inadequacies (design/fieldwork). **NOTE:** Finance is NOT a limitation.
        *   **Suggestion for Further Study:** Suggest studies to address limitations.
        *   **Summary of the Study:** Abridged form of the entire research, presented in paragraphs (one per chapter).
    *   **References:** In strict APA 7th edition format. Ensure the list is professional and follows all APA 7th conventions (Author, Date, Title, Source).
    *   **Appendices:** Placeholder for any supplementary materials (A, B, C...).
3.  **Table Formatting & Mathematical Accuracy:**
    *   **Full Borders:** All tables **MUST** include vertical lines for full borders. Use Markdown table syntax.
    *   **Likert Scale Tables:** For tables with SA (4), A (3), D (2), and SD (1) columns:
        1.  **Frequency Consistency:** Ensure that SA, A, D, and SD frequencies for each item add up exactly to the stated sample size (N).
        2.  **N Formatting:** The sample size (N) must be written clearly (e.g., 300), not with spaces (e.g., 30 0).
        3.  **Weighted Total:** Recalculate correctly using: (SA × 4) + (A × 3) + (D × 2) + (SD × 1).
        4.  **Mean Score:** Recalculate using: Weighted Total ÷ N. Format to 2 decimal places.
        5.  **Standard Deviation (SD):** Calculate accurately based on the frequencies.
        6.  **Grand Mean Row:** Every results table **MUST** end with a "Grand Mean" row.
            *   **S/N:** Sequential number.
            *   **Item:** "Grand Mean".
            *   **SA, A, D, SD, Total:** You **MUST** output a dash "-" (not numbers) in these columns. Do not calculate totals for these.
            *   **N:** State the full sample size (e.g., 300).
            *   **Mean:** The average of all item means in that table.
            *   **SD:** The average of all item standard deviations in that table.
            *   **Remark:** Overall remark (e.g., "Accepted").
            *   **Format:** Ensure the Grand Mean row is a single line.
        7.  **Internal Consistency:** Ensure all values are mathematically consistent. Do not estimate; use exact calculations.
    *   **Figure/Diagram Labels:** When generating schemas or diagrams (like the Conceptual Framework), ensure the title is placed clearly BELOW the diagram with sufficient spacing so it is not blocked.
    *   **No Dashes:** Do NOT use dashes (______) in the List of Tables, List of Figures, or List of Appendices. Use a clean, professional layout.
4.  **Length:** Each chapter should be substantial, aiming for at least 500-800 words, unless the content naturally requires less.
5.  **Tone:** Maintain a formal, academic, and objective tone throughout the project.
6.  **Originality:** The generated content must be unique and not directly copied from existing sources. Synthesize information in a new way.
7.  **Placeholder for dynamic content:** For Table of Contents and List of Tables, if actual dynamic generation is not possible, provide a clear placeholder indicating that it will be generated automatically.

Generate the content as a JSON object with the following structure:
\`\`\`json
{
  "dedication": "<Dedication content>",
  "acknowledgement": "<Acknowledgement content>",
  "tableOfContents": "<Table of Contents markdown>",
  "listOfTables": "<List of Tables markdown>",
  "abstract": "<Abstract content>",
  "chapter1": "<Chapter 1 content>",
  "chapter2": "<Chapter 2 content>",
  "chapter3": "<Chapter 3 content>",
  "chapter4": "<Chapter 4 content>",
  "chapter5": "<Chapter 5 content>",
  "references": "<References content>",
  "appendices": "<Appendices content>"
}
\`\`\`

Ensure all content is within the specified JSON keys. Do not include any additional text or formatting outside the JSON object.`;


router.get('/eligibility', protect, async (req: AuthenticatedRequest, res) => {
  console.log('Received eligibility check request');
  if (!supabase) {
    console.error('Eligibility: Supabase client not initialized');
    return res.status(503).json({ error: 'Database service is unavailable' });
  }
  try {
    console.log(`Checking eligibility for user: ${req.user.id}`);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('project_credits, balance, reg_no, full_name')
      .eq('id', req.user.id)
      .single();

    if (userError || !user) {
      console.error('Eligibility: User not found or fetch error', userError);
      return res.status(404).json({ eligible: false, reason: 'user_not_found' });
    }

    const credits = user.project_credits || 0;
    const balance = user.balance || 0;
    
    // Fetch dynamic settings
    const { data: settings } = await supabase.from('settings').select('*');
    const projectCostCredits = parseInt(settings?.find(s => s.key === 'project_cost_credits')?.value || '1');
    const creditValueNaira = parseInt(settings?.find(s => s.key === 'credit_value_naira')?.value || '1000');
    const projectCostNaira = projectCostCredits * creditValueNaira;

    console.log(`User stats - Credits: ${credits}, Balance: ${balance}, RegNo: ${user.reg_no}`);

    // Paid users (with credits or sufficient balance) are always eligible
    if (credits >= projectCostCredits) {
      console.log('User eligible: has credits');
      return res.json({ eligible: true, reason: 'has_credits' });
    }

    if (balance >= projectCostNaira) {
      console.log('User eligible: has balance');
      return res.json({ eligible: true, reason: 'has_balance' });
    }

    // Free tier logic: REMOVED as per user request
    console.log('User ineligible: no credits or balance');
    return res.json({ eligible: false, reason: 'insufficient_funds' });
  } catch (error) {
    console.error('Eligibility check error:', error);
    res.status(500).json({ error: 'Failed to check eligibility' });
  }
});

// Get all projects for a user (without heavy content)
router.get('/:userId', protect, async (req: AuthenticatedRequest, res) => {
  console.log(`Fetching projects for user: ${req.params.userId}`);
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  
  if (String(req.user.id) !== String(req.params.userId)) {
    console.warn(`Forbidden access attempt: User ${req.user.id} tried to access projects of ${req.params.userId}`);
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      // Exclude 'content' to prevent 502 timeouts on large payloads
      .select('id, user_id, topic, details, is_premium_generated, created_at')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch projects error:', error);
      throw error;
    }
    
    console.log(`Found ${projects?.length || 0} projects for user ${req.params.userId}`);
    res.json({ projects });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project with full content
router.get('/single/:id', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (String(project.user_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(project);
  } catch (error) {
    console.error('Failed to fetch project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create a new project
router.post('/', protect, async (req: AuthenticatedRequest, res) => {
  console.log('Received create project request');
  if (!supabase) {
    console.error('Supabase client not initialized');
    return res.status(503).json({ error: 'Database service is unavailable' });
  }
  
  try {
    const { topic, department, content, details, is_premium_generated } = req.body;
    console.log(`Creating project: ${topic}, Dept: ${department}, Premium: ${is_premium_generated}`);
    console.log(`Content keys: ${Object.keys(content || {}).join(', ')}`);
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('project_credits, balance, reg_no, full_name, has_free_access')
      .eq('id', req.user.id)
      .single();

    if (userError || !user) {
      console.error('Create Project: User not found or fetch error', userError);
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch dynamic settings
    const { data: settings } = await supabase.from('settings').select('*');
    const projectCostCredits = parseInt(settings?.find(s => s.key === 'project_cost_credits')?.value || '1');
    const creditValueNaira = parseInt(settings?.find(s => s.key === 'credit_value_naira')?.value || '1000');
    const projectCostNaira = projectCostCredits * creditValueNaira;

    const balance = user.balance || 0;
    const credits = user.project_credits || 0;

    let newBalance = balance;
    let newCredits = credits;

    // Only deduct if not already paid (is_premium_generated flag from client)
    if (!is_premium_generated && !user.has_free_access) {
      if (credits >= projectCostCredits) {
        newCredits -= projectCostCredits;
        // Also deduct the corresponding balance to keep them in sync
        newBalance = Math.max(0, balance - projectCostNaira);
        
        // Record transaction for credit usage
        await supabase
          .from('transactions')
          .insert([{
            user_id: req.user.id,
            amount: -projectCostNaira,
            status: 'successful',
            reference: `Project Generation (Used ${projectCostCredits} Credit): ${topic.substring(0, 30)}...`
          }]);
      } else if (balance >= projectCostNaira) {
        newBalance -= projectCostNaira;
        newCredits = Math.floor(newBalance / creditValueNaira);
        // Record transaction for balance usage
        await supabase
          .from('transactions')
          .insert([{
            user_id: req.user.id,
            amount: -projectCostNaira,
            status: 'successful',
            reference: `Project Generation (Balance): ${topic.substring(0, 30)}...`
          }]);
      } else {
        return res.status(402).json({ error: 'Insufficient funds or credits to generate project. Please purchase credits.' });
      }

      // Update user balance and credits
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          balance: newBalance,
          project_credits: newCredits
        })
        .eq('id', req.user.id);

      if (updateError) {
        console.error('CRITICAL: Failed to deduct balance/credits:', updateError);
        return res.status(500).json({ 
          error: 'Failed to process payment. Your balance was not deducted, and the project could not be created.',
          details: updateError.message 
        });
      } else {
        console.log(`Deducted ${projectCostNaira} (or credits) from user ${req.user.id}. New Balance: ${newBalance}`);
      }
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert([{
        user_id: req.user.id,
        topic,
        department,
        content,
        details: details || {},
        is_premium_generated: true
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update a project
router.put('/:id', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { topic, content, details } = req.body;
  try {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (String(project.user_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updateData: any = { topic, content };
    if (details) updateData.details = details;

    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete a project
router.delete('/:id', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  try {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (String(project.user_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Deduct for PPT generation
router.post('/ppt-deduct', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { topic, projectId } = req.body;
  
  try {
    // Check if project is premium generated
    if (projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('is_premium_generated')
        .eq('id', projectId)
        .single();
      
      if (project?.is_premium_generated) {
        return res.json({ success: true, isFree: true });
      }
    }

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('project_credits, balance, has_free_access')
      .eq('id', req.user.id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch dynamic settings
    const { data: settings } = await supabase.from('settings').select('*');
    const creditValueNaira = parseInt(settings?.find(s => s.key === 'credit_value_naira')?.value || '1000');
    
    const currentBalance = user.balance || 0;
    const currentCredits = user.project_credits || 0;
    
    // PPT Cost: 1 Credit
    const costInNaira = creditValueNaira;
    
    if (currentBalance < costInNaira) {
      return res.status(402).json({ 
        error: `Insufficient funds. You need ₦${costInNaira.toLocaleString()}.`,
        requiredBalance: costInNaira
      });
    }

    let newBalance = currentBalance;
    let newCredits = currentCredits;

    newBalance -= costInNaira;
    newCredits = Math.floor(newBalance / creditValueNaira);

    await supabase
      .from('users')
      .update({ 
        project_credits: newCredits,
        balance: newBalance,
        has_free_access: user.has_free_access || newCredits > 0
      })
      .eq('id', req.user.id);

    // Record transaction
    await supabase
      .from('transactions')
      .insert([{
        user_id: req.user.id,
        amount: -costInNaira,
        status: 'successful',
        reference: `PPT Generation: ${topic.substring(0, 30)}...`
      }]);
      
    return res.json({ success: true, balance: newBalance, credits: newCredits });

  } catch (error) {
    console.error('PPT deduct error:', error);
    res.status(500).json({ error: 'Failed to process PPT payment' });
  }
});

// Deduct for Defense Script generation
router.post('/defense-deduct', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { topic, projectId } = req.body;
  
  try {
    // Check if project is premium generated
    if (projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('is_premium_generated')
        .eq('id', projectId)
        .single();
      
      if (project?.is_premium_generated) {
        return res.json({ success: true, isFree: true });
      }
    }

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('project_credits, balance, has_free_access')
      .eq('id', req.user.id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch dynamic settings
    const { data: settings } = await supabase.from('settings').select('*');
    const creditValueNaira = parseInt(settings?.find(s => s.key === 'credit_value_naira')?.value || '1000');
    
    const currentBalance = user.balance || 0;
    const currentCredits = user.project_credits || 0;
    
    // Defense Cost: 1 Credit (₦1,000)
    const costInNaira = creditValueNaira;

    if (currentBalance < costInNaira) {
      return res.status(402).json({ 
        error: `Insufficient funds. You need ₦${costInNaira.toLocaleString()}.`,
        requiredBalance: costInNaira
      });
    }

    let newBalance = currentBalance;
    let newCredits = currentCredits;

    newBalance -= costInNaira;
    newCredits = Math.floor(newBalance / creditValueNaira);

    await supabase
      .from('users')
      .update({ 
        project_credits: newCredits, 
        balance: newBalance,
        has_free_access: user.has_free_access || newCredits > 0
      })
      .eq('id', req.user.id);

    await supabase.from('transactions').insert([{
      user_id: req.user.id,
      amount: -costInNaira,
      status: 'successful',
      reference: `Defense Script Generation: ${topic.substring(0, 30)}...`
    }]);
        
    return res.json({ success: true, balance: newBalance, credits: newCredits });

  } catch (error) {
    console.error('Defense deduct error:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

export default router;
