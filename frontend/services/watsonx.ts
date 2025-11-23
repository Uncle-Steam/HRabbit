// IBM Watsonx Orchestrate Integration
import { KnowledgeGap, UserContext, InterviewAnswer } from "../types";

// IBM Watsonx Orchestrate API Configuration
interface WatsonxConfig {
  apiEndpoint: string;
  apiKey: string;
}

interface JWTToken {
  token: string;
  expiresAt: number;
}

interface Skillset {
  id: string;
  name: string;
  description?: string;
}

interface Skill {
  id: string;
  name: string;
  description?: string;
  openapiUrl?: string;
}

// Cache for JWT token
let cachedToken: JWTToken | null = null;

/**
 * Get Watsonx Orchestrate configuration from environment variables
 */
const getConfig = (): WatsonxConfig => {
  const apiEndpoint = process.env.WATSONX_API_ENDPOINT || process.env.WATSONX_ORCHESTRATE_ENDPOINT;
  const apiKey = process.env.WATSONX_API_KEY || process.env.WATSONX_ORCHESTRATE_API_KEY;

  if (!apiEndpoint) {
    throw new Error("WATSONX_API_ENDPOINT not found in environment. Please set it in .env.local");
  }
  if (!apiKey) {
    throw new Error("WATSONX_API_KEY not found in environment. Please set it in .env.local");
  }

  return { apiEndpoint: apiEndpoint.replace(/\/$/, ''), apiKey };
};

/**
 * Authenticate with IBM Watsonx Orchestrate API and get JWT token
 */
const getAuthToken = async (): Promise<string> => {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  const config = getConfig();
  
  try {
    const response = await fetch(`${config.apiEndpoint}/v1/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
    });

    if (!response.ok) {
      // Alternative authentication endpoint format
      const altResponse = await fetch(`${config.apiEndpoint}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
      });

      if (!altResponse.ok) {
        throw new Error(`Authentication failed: ${altResponse.status} ${altResponse.statusText}`);
      }

      const altData = await altResponse.json();
      const token = altData.token || altData.access_token || altData.jwt;
      
      if (!token) {
        throw new Error("No token received from authentication endpoint");
      }

      // Cache token (assume 1 hour expiry if not provided)
      cachedToken = {
        token,
        expiresAt: Date.now() + (altData.expires_in ? altData.expires_in * 1000 : 3600000),
      };

      return token;
    }

    const data = await response.json();
    const token = data.token || data.access_token || data.jwt;
    
    if (!token) {
      throw new Error("No token received from authentication endpoint");
    }

    // Cache token (assume 1 hour expiry if not provided)
    cachedToken = {
      token,
      expiresAt: Date.now() + (data.expires_in ? data.expires_in * 1000 : 3600000),
    };

    return token;
  } catch (error) {
    console.error("Watsonx authentication error:", error);
    throw new Error(`Failed to authenticate with Watsonx Orchestrate: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Discover available skillsets
 */
const getSkillsets = async (): Promise<Skillset[]> => {
  const token = await getAuthToken();
  const config = getConfig();

  try {
    const response = await fetch(`${config.apiEndpoint}/v1/skillsets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch skillsets: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.skillsets || data.items || [];
  } catch (error) {
    console.error("Error fetching skillsets:", error);
    return [];
  }
};

/**
 * Get skills from a specific skillset
 */
const getSkills = async (skillsetId: string): Promise<Skill[]> => {
  const token = await getAuthToken();
  const config = getConfig();

  try {
    const response = await fetch(`${config.apiEndpoint}/v1/skillsets/${skillsetId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch skills: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.skills || data.items || [];
  } catch (error) {
    console.error(`Error fetching skills for skillset ${skillsetId}:`, error);
    return [];
  }
};

/**
 * Invoke a skill to generate knowledge gaps using connected data sources
 */
const invokeKnowledgeGapSkill = async (
  context: UserContext,
  skillsetId: string,
  skillId: string
): Promise<KnowledgeGap[]> => {
  const token = await getAuthToken();
  const config = getConfig();

  const prompt = {
    employee_context: {
      name: context.name,
      role: context.role,
      department: context.department,
    },
    task: "Generate knowledge gaps for employee offboarding interview",
    requirements: {
      number_of_gaps: 4,
      format: "structured_interview_questions",
      use_connected_data_sources: true, // Request to use connected data sources
    },
  };

  try {
    // Try the standard skill invocation endpoint
    const response = await fetch(
      `${config.apiEndpoint}/v1/skillsets/${skillsetId}/skills/${skillId}/invoke`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prompt),
      }
    );

    if (!response.ok) {
      // Try alternative endpoint format
      const altResponse = await fetch(
        `${config.apiEndpoint}/v1/skills/${skillId}/invoke`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(prompt),
        }
      );

      if (!altResponse.ok) {
        throw new Error(`Skill invocation failed: ${altResponse.status} ${altResponse.statusText}`);
      }

      const altData = await altResponse.json();
      return parseKnowledgeGaps(altData);
    }

    const data = await response.json();
    return parseKnowledgeGaps(data);
  } catch (error) {
    console.error("Error invoking knowledge gap skill:", error);
    throw error;
  }
};

/**
 * Parse the response from Watsonx into KnowledgeGap format
 */
const parseKnowledgeGaps = (response: any): KnowledgeGap[] => {
  try {
    // Handle different response formats
    let gaps: any[] = [];

    if (Array.isArray(response)) {
      gaps = response;
    } else if (response.gaps) {
      gaps = response.gaps;
    } else if (response.result) {
      gaps = Array.isArray(response.result) ? response.result : [response.result];
    } else if (response.data) {
      gaps = Array.isArray(response.data) ? response.data : [response.data];
    } else if (response.content) {
      // If content is a string, try to parse it
      if (typeof response.content === 'string') {
        try {
          gaps = JSON.parse(response.content);
        } catch {
          // If parsing fails, try to extract JSON from the string
          const jsonMatch = response.content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            gaps = JSON.parse(jsonMatch[0]);
          }
        }
      } else {
        gaps = Array.isArray(response.content) ? response.content : [response.content];
      }
    }

    // Validate and format gaps - all data must come from API response
    return gaps
      .filter((gap: any) => {
        // Require essential fields from API response
        return gap && (
          (gap.id || gap.title || gap.primaryQuestion) &&
          gap.title && 
          gap.primaryQuestion
        );
      })
      .map((gap: any, index: number) => {
        // Extract fields from API response, throw error if required fields are missing
        if (!gap.title) {
          throw new Error(`Knowledge gap at index ${index} is missing required field: title`);
        }
        if (!gap.primaryQuestion) {
          throw new Error(`Knowledge gap at index ${index} is missing required field: primaryQuestion`);
        }

        // All data must come from API - use alternative field names if API uses different structure
        // but ensure required fields are present
        return {
          id: gap.id || `gap-${index + 1}`, // Generate ID if not provided by API
          title: gap.title || gap.name || '', // Allow alternative field names from API
          summary: gap.summary || gap.description || gap.risk || '', // Optional field, allow alternative names
          primaryQuestion: gap.primaryQuestion || gap.question || gap.prompt || '', // Required, but allow alternative names
          memoryPrompt: gap.memoryPrompt || gap.memoryTrigger || gap.trigger || '', // Optional field
          followUpQuestion: gap.followUpQuestion || gap.followUp || gap.detailQuestion || '', // Optional field
        };
      })
      .filter((gap: KnowledgeGap) => {
        // Ensure all required fields are present and not empty
        return gap.title && gap.title.trim() !== '' && gap.primaryQuestion && gap.primaryQuestion.trim() !== '';
      })
      .slice(0, 4); // Ensure we only return 4 gaps
  } catch (error) {
    console.error("Error parsing knowledge gaps:", error);
    return [];
  }
};

/**
 * Generate knowledge gaps using IBM Watsonx Orchestrate with connected data sources
 */
export const generateGaps = async (context: UserContext): Promise<KnowledgeGap[]> => {
  try {
    const config = getConfig();
    
    // Step 1: Discover available skillsets
    const skillsets = await getSkillsets();
    
    if (skillsets.length === 0) {
      throw new Error("No skillsets available. Please check your Watsonx Orchestrate configuration.");
    }

    // Step 2: Find a suitable skillset (prefer 'assistant' or 'team' skillsets)
    let targetSkillset = skillsets.find(s => 
      s.name?.toLowerCase().includes('assistant') || 
      s.name?.toLowerCase().includes('team') ||
      s.name?.toLowerCase().includes('knowledge')
    ) || skillsets[0];

    // Step 3: Get skills from the skillset
    const skills = await getSkills(targetSkillset.id);
    
    if (skills.length === 0) {
      throw new Error(`No skills available in skillset ${targetSkillset.name}`);
    }

    // Step 4: Find a suitable skill for knowledge gap generation
    // Look for skills related to knowledge, analysis, or generation
    let targetSkill = skills.find(s => 
      s.name?.toLowerCase().includes('knowledge') ||
      s.name?.toLowerCase().includes('analyze') ||
      s.name?.toLowerCase().includes('generate') ||
      s.name?.toLowerCase().includes('question')
    ) || skills[0];

    console.log(`Using skillset: ${targetSkillset.name}, skill: ${targetSkill.name}`);

    // Step 5: Invoke the skill to generate knowledge gaps
    const gaps = await invokeKnowledgeGapSkill(context, targetSkillset.id, targetSkill.id);

    if (gaps.length === 0) {
      throw new Error("No knowledge gaps generated. The skill may need different input parameters.");
    }

    return gaps;
  } catch (error) {
    console.error("Error generating gaps with Watsonx Orchestrate:", error);
    
    // Provide helpful error message
    if (error instanceof Error) {
      throw new Error(`Watsonx Orchestrate Error: ${error.message}`);
    }
    
    throw new Error("Failed to generate knowledge gaps using Watsonx Orchestrate. Please check your API configuration and connected data sources.");
  }
};

/**
 * Generate final handover document using Watsonx Orchestrate
 */
export const generateFinalHandover = async (
  context: UserContext,
  gaps: KnowledgeGap[],
  answers: Record<string, InterviewAnswer>
): Promise<string> => {
  try {
    const token = await getAuthToken();
    const config = getConfig();
    const skillsets = await getSkillsets();
    
    if (skillsets.length === 0) {
      throw new Error("No skillsets available");
    }

    const targetSkillset = skillsets[0];
    const skills = await getSkills(targetSkillset.id);
    
    if (skills.length === 0) {
      throw new Error("No skills available");
    }

    // Find a skill suitable for document generation
    let targetSkill = skills.find(s => 
      s.name?.toLowerCase().includes('document') ||
      s.name?.toLowerCase().includes('generate') ||
      s.name?.toLowerCase().includes('summary')
    ) || skills[0];

    // Format interview data
    const interviewData = gaps.map(gap => {
      const ans = answers[gap.id]?.content || "No answer provided.";
      return {
        topic: gap.title,
        question: gap.primaryQuestion,
        transcript: ans,
      };
    });

    const prompt = {
      task: "Generate a professional knowledge handover document",
      employee: {
        name: context.name,
        role: context.role,
        department: context.department,
      },
      interview_data: interviewData,
      format: "markdown",
      structure: [
        "Executive Summary",
        "Critical Risks Identified",
        "Detailed Knowledge Transfer (per topic)",
        "Recommended Next Steps",
      ],
    };

    const response = await fetch(
      `${config.apiEndpoint}/v1/skillsets/${targetSkillset.id}/skills/${targetSkill.id}/invoke`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prompt),
      }
    );

    if (!response.ok) {
      throw new Error(`Document generation failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract document content from response
    if (typeof data === 'string') {
      return data;
    } else if (data.content) {
      return typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
    } else if (data.result) {
      return typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
    } else if (data.document) {
      return typeof data.document === 'string' ? data.document : JSON.stringify(data.document);
    }

    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("Error generating handover document:", error);
    throw new Error(`Failed to generate handover document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

