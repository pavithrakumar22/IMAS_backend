import { GoogleGenerativeAI } from "@google/generative-ai";
import { loadEnv } from "../../loadEnv.js";

loadEnv();

class SimplifyAgent {
    constructor() {
        console.log('🔧 Initializing SimplifyAgent');
        
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }

        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", 
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
            }
        });
    }

    /**
     * Universal method to process ANY medical agent output
     */
    async processMedicalData(medicalData, targetAudience = "general") {
        try {
            console.log('📥 Processing medical data from agent pipeline');

            // Extract and normalize data from any agent type
            const normalizedData = this._normalizeAgentData(medicalData);
            console.log('🔍 Normalized data:', {
                original: normalizedData.original,
                complexity: normalizedData.complexity,
                hasDiagnosis: !!normalizedData.diagnosis
            });
            
            const originalMarkdown = await this._createUniversalMarkdown(normalizedData);
            
            const simplifiedData = await this._createUniversalSimplification(normalizedData, targetAudience);
            
            // Format final response for frontend
            const result = this._formatFrontendResponse(normalizedData, originalMarkdown, simplifiedData);

            console.log('✅ Processing completed successfully');
            return result;

        } catch (error) {
            console.error("❌ Processing error:", error);
            return this._createErrorResponse(medicalData, error.message);
        }
    }

    /**
     * Normalize data from LOW, MEDIUM, HIGH complexity agents
     */
    _normalizeAgentData(medicalData) {
        console.log('🔍 Normalizing medical data:', {
            hasOriginal: !!medicalData.original,
            hasTranslated: !!medicalData.translated,
            hasComplexity: !!medicalData.complexity,
            hasDiagnosis: !!medicalData.diagnosis,
            complexityType: typeof medicalData.complexity
        });

        if (medicalData.original && medicalData.diagnosis) {
            const complexityValue = medicalData.complexity?.complexity || 
                                  medicalData.complexity?.level || 
                                  medicalData.complexity || 
                                  "UNKNOWN";
            
            return {
                original: medicalData.original,
                translated: medicalData.translated || medicalData.original,
                complexity: complexityValue,
                complexityDetails: medicalData.complexity,
                diagnosis: medicalData.diagnosis
            };
        }

        if (typeof medicalData === 'string') {
            return {
                original: medicalData,
                translated: medicalData,
                complexity: "UNKNOWN",
                diagnosis: { symptoms: [medicalData] }
            };
        }

        if (medicalData.recommendations) {
            return {
                original: medicalData.input?.symptoms || "Low complexity case",
                translated: medicalData.input?.symptoms || "Low complexity case",
                complexity: "LOW",
                complexityDetails: {
                    complexity: "LOW",
                    reason: "Condition can be managed with simple home care"
                },
                diagnosis: {
                    condition: medicalData.recommendations.condition,
                    symptoms: medicalData.input?.symptoms ? [medicalData.input.symptoms] : [],
                    precautions: medicalData.recommendations.precautions,
                    medications: medicalData.recommendations.medications,
                    natural_remedies: medicalData.recommendations.natural_remedies,
                    advice: medicalData.recommendations.advice,
                    follow_up: medicalData.recommendations.follow_up
                }
            };
        }

        if (medicalData.symptoms && medicalData.doctors) {
            return {
                original: medicalData.original || "Medium complexity case",
                translated: medicalData.translated || "Medium complexity case",
                complexity: "MEDIUM",
                complexityDetails: {
                    complexity: "MEDIUM",
                    reason: "Requires medical evaluation"
                },
                diagnosis: {
                    symptoms: medicalData.symptoms,
                    doctors: medicalData.doctors,
                    specialistResponses: medicalData.specialistResponses
                }
            };
        }

        if (medicalData.complexity === "HIGH") {
            return {
                original: medicalData.condition || "High complexity case",
                translated: medicalData.condition || "High complexity case",
                complexity: "HIGH",
                complexityDetails: {
                    complexity: "HIGH",
                    reason: "Requires immediate specialist attention"
                },
                diagnosis: {
                    isEmergency: medicalData.isEmergency,
                    specialist: medicalData.specialist,
                    immediateActions: medicalData.immediateActions,
                    note: medicalData.note
                }
            };
        }

        return {
            original: JSON.stringify(medicalData),
            translated: JSON.stringify(medicalData),
            complexity: medicalData.complexity || "UNKNOWN",
            complexityDetails: medicalData.complexity || { complexity: "UNKNOWN", reason: "Unknown condition" },
            diagnosis: medicalData.diagnosis || medicalData
        };
    }

    /**
     * Create universal markdown that works for all agent types
     */
    async _createUniversalMarkdown(normalizedData) {
        try {
            console.log('🔍 Creating universal markdown...');
            
            const prompt = `
            Create a comprehensive medical report in markdown format based on this medical data.
            
            MEDICAL DATA:
            ${JSON.stringify({
                original: normalizedData.original,
                complexity: normalizedData.complexity,
                diagnosis: normalizedData.diagnosis
            }, null, 2)}
            
            Create a professional markdown report with the following structure:
            
            # Medical Diagnosis Report
            
            ## Patient Information
            [Extract patient information from the original field]
            
            ## Clinical Assessment
            [Detailed clinical assessment based on the diagnosis data]
            
            ## Diagnostic Findings
            [Key findings, symptoms, and observations]
            
            ## Treatment Recommendations  
            [Medications, procedures, and treatment plans]
            
            ## Follow-up Guidance
            [When to seek further care and warning signs]
            
            Use proper medical formatting:
            - Clear hierarchical headers (#, ##, ###)
            - Bullet points for lists
            - **Bold** for important medical terms
            - Tables if appropriate
            - Professional medical terminology
            - Structured and easy to read
            
            Return ONLY the markdown content, no additional explanations.

            Markdown Report:
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const markdown = response.text().trim();

            console.log('🔍 Markdown generated, length:', markdown.length);

            return markdown && markdown.length > 100 ? markdown : this._createFallbackMarkdown(normalizedData);

        } catch (error) {
            console.error("❌ Markdown creation error:", error);
            return this._createFallbackMarkdown(normalizedData);
        }
    }

    /**
     * Create universal simplification for all agent types
     */
    async _createUniversalSimplification(normalizedData, audience) {
        try {
            console.log('🔍 Creating universal simplification for audience:', audience);
            
            const prompt = `
            Explain this medical information in SIMPLE, FRIENDLY language for a ${audience} audience.
            
            MEDICAL INFORMATION:
            ${JSON.stringify(normalizedData.diagnosis, null, 2)}
            
            COMPLEXITY LEVEL: ${normalizedData.complexity}
            
            Create TWO versions:
            
            1. PLAIN TEXT (simple conversational version):
            [Write like you're explaining to a friend - warm, reassuring, no medical jargon. Use everyday language. Focus on what the patient needs to know and do.]
            
            2. MARKDOWN (formatted for easy reading):
            [Same content but with clear markdown formatting - headers, bullet points, bold for emphasis. Make it easy to read and understand.]
            
            Focus on:
            - What's happening in simple terms
            - What they should do next
            - When to seek help
            - Reassuring and supportive tone
            - Clear action steps
            
            PLAIN TEXT:
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const fullResponse = response.text();

            console.log('🔍 Simplification response received, length:', fullResponse.length);

            const { plainText, markdown } = this._parseSimplificationResponse(fullResponse);
            
            return {
                simplified: plainText,
                markdown: markdown
            };

        } catch (error) {
            console.error("❌ Simplification error:", error);
            return this._createFallbackSimplification(normalizedData);
        }
    }

    /**
     * Parse simplification response
     */
    _parseSimplificationResponse(fullResponse) {
        try {
            console.log('🔍 Parsing simplification response...');
            
            let plainText = '';
            let markdown = '';

            const plainTextMatch = fullResponse.match(/PLAIN TEXT:?([\s\S]*?)(?=MARKDOWN|## |# |$)/i);
            const markdownMatch = fullResponse.match(/MARKDOWN:?([\s\S]*?)$/i);

            if (plainTextMatch?.[1]) {
                plainText = plainTextMatch[1].trim();
                console.log('🔍 Found plain text via structured match');
            }

            if (markdownMatch?.[1]) {
                markdown = markdownMatch[1].trim();
                console.log('🔍 Found markdown via structured match');
            }

            if (!plainText || !markdown) {
                console.log('🔍 Trying fallback parsing...');
                const sections = fullResponse.split(/(?=## |# |MARKDOWN)/i);
                
                if (sections.length >= 2) {
                    plainText = sections[0].replace(/PLAIN TEXT:?/gi, '').trim();
                    markdown = sections.slice(1).join('').replace(/MARKDOWN:?/gi, '').trim();
                    console.log('🔍 Used section splitting fallback');
                } else {
                    // Method 3: Use the whole response for both
                    plainText = this._cleanText(fullResponse);
                    markdown = `## Simple Explanation\n\n${plainText}`;
                    console.log('🔍 Used full response fallback');
                }
            }

            plainText = plainText.replace(/PLAIN TEXT:?/gi, '').trim();
            markdown = markdown.replace(/MARKDOWN:?/gi, '').trim();

            if (!plainText || plainText.length < 20) {
                console.log('🔍 Plain text too short, using fallback');
                plainText = "Based on your symptoms, it's important to rest and stay hydrated. Please monitor how you're feeling and see a doctor if things don't improve or get worse.";
            }

            if (!markdown || markdown.length < 20 || !markdown.includes('#')) {
                console.log('🔍 Markdown too short, creating from plain text');
                markdown = `## Simple Explanation\n\n${plainText}`;
            }

            console.log('🔍 Final content lengths - Plain text:', plainText.length, 'Markdown:', markdown.length);

            return { plainText, markdown };

        } catch (error) {
            console.error("❌ Parsing error:", error);
            const fallback = "I understand you're not feeling well. The main things to focus on are resting, drinking plenty of fluids, and monitoring your symptoms. If you're concerned or don't start feeling better soon, please see a doctor for proper advice.";
            return {
                plainText: fallback,
                markdown: `## Medical Advice\n\n${fallback}`
            };
        }
    }

    /**
     * Format final response for frontend
     */
    _formatFrontendResponse(normalizedData, originalMarkdown, simplifiedData) {
        console.log('🔍 Formatting frontend response...');
        
        const finalOriginalMarkdown = originalMarkdown && originalMarkdown.length > 100 
            ? originalMarkdown 
            : this._createFallbackMarkdown(normalizedData);

        const finalSimplified = simplifiedData.simplified && simplifiedData.simplified.length > 20 
            ? simplifiedData.simplified 
            : "Based on your symptoms, it's important to rest and stay hydrated. Please consult a healthcare provider for proper evaluation.";

        const finalSimplifiedMarkdown = simplifiedData.markdown && simplifiedData.markdown.length > 50 
            ? simplifiedData.markdown 
            : `## Simple Explanation\n\n${finalSimplified}`;

        const complexityResponse = normalizedData.complexityDetails || {
            complexity: normalizedData.complexity,
            reason: this._getComplexityReason(normalizedData.complexity)
        };

        const result = {
            success: true,
            original: normalizedData.original,
            translated: normalizedData.translated,
            complexity: complexityResponse,
            diagnosis: normalizedData.diagnosis,
            simplified: {
                simplified: finalSimplified,
                simplifiedMarkdown: finalSimplifiedMarkdown,
                originalDiagnosisMarkdown: finalOriginalMarkdown
            },
            timestamp: new Date().toISOString()
        };

        console.log('🔍 Final response formatted:', {
            originalLength: result.original?.length,
            simplifiedLength: result.simplified.simplified?.length,
            simplifiedMarkdownLength: result.simplified.simplifiedMarkdown?.length,
            originalDiagnosisMarkdownLength: result.simplified.originalDiagnosisMarkdown?.length
        });

        return result;
    }

    /**
     * Helper methods
     */
    _cleanText(text) {
        return text.replace(/#+|\\*\\*|\\*|\\- /g, '')
                  .replace(/\n+/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
    }

    _getComplexityReason(complexity) {
        const reasons = {
            "LOW": "Condition can be managed with simple home care and OTC medications",
            "MEDIUM": "Requires medical evaluation but can be managed with basic care",
            "HIGH": "Requires immediate specialist attention and possibly emergency care",
            "UNKNOWN": "Medical evaluation needed to determine appropriate care"
        };
        return reasons[complexity] || "Medical assessment required";
    }

    _createFallbackMarkdown(data) {
        console.log('🔍 Creating fallback markdown');
        return `# Medical Assessment Report

## Patient Presentation
- **Chief Complaint**: ${data.original}
- **Complexity Level**: ${data.complexity}

## Clinical Summary
Medical evaluation is recommended based on the presented symptoms. Please consult with a healthcare provider for proper diagnosis and treatment planning.

## Assessment
Based on the symptoms described, a thorough medical evaluation is advised to determine the appropriate course of treatment.

## Recommendations
1. Schedule a medical appointment for proper evaluation
2. Monitor symptoms closely and note any changes
3. Seek immediate medical attention if symptoms worsen
4. Follow any specific guidance provided by healthcare professionals

## Next Steps
- Consult with a healthcare provider for personalized medical advice
- Keep track of your symptoms and their progression
- Follow up as recommended by your medical team`;
    }

    _createFallbackSimplification() {
        const baseText = "Based on your symptoms, it's important to take care of yourself. Rest well, drink plenty of fluids, and keep an eye on how you're feeling. If you don't start to feel better soon or if things get worse, please see a doctor for proper evaluation.";
        
        return {
            simplified: baseText,
            markdown: `## Simple Advice\n\n${baseText}\n\n### What to Do Next:\n\n1. **Rest and hydrate** - Give your body time to recover\n2. **Monitor symptoms** - Keep track of how you're feeling\n3. **See a doctor** - If things don't improve or get worse\n4. **Follow medical advice** - Always consult with healthcare professionals`
        };
    }

    _createErrorResponse(originalData, error) {
        console.error('🔍 Creating error response:', error);
        
        return {
            success: false,
            original: typeof originalData === 'string' ? originalData : JSON.stringify(originalData),
            translated: typeof originalData === 'string' ? originalData : JSON.stringify(originalData),
            complexity: {
                complexity: "ERROR",
                reason: "Processing error occurred"
            },
            diagnosis: {},
            simplified: {
                simplified: "We're currently unable to process your medical information. Please try again or consult directly with a healthcare provider.",
                simplifiedMarkdown: "## System Notice\n\nWe're currently unable to process your medical information. Please try again or consult directly with a healthcare provider.",
                originalDiagnosisMarkdown: "# Medical Information\n\nUnable to process medical data at this time. Please try again later."
            },
            error: error,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Direct simplification for testing
     */
    async simplifyDirectly(medicalContent, audience = "general") {
        try {
            console.log('🔧 Direct simplification requested');
            const normalized = this._normalizeAgentData(medicalContent);
            const result = await this._createUniversalSimplification(normalized, audience);
            return {
                success: true,
                simplified: result.simplified,
                markdown: result.markdown,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error("❌ Direct simplification error:", error);
            return {
                success: false,
                simplified: this._createFallbackSimplification({}).simplified,
                markdown: this._createFallbackSimplification({}).markdown,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

export default SimplifyAgent;