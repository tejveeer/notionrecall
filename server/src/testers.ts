import { DeepseekAPI } from "./deepseek-api";

interface BaseQuestion {
    question: string;
}

interface MultipleChoice extends BaseQuestion {
    options: string[];
    answer: string;  // Must exist in options
}

interface TrueFalse extends BaseQuestion {
    answer: boolean;
}

interface FillInBlank extends BaseQuestion {
    answer: string[];
}

type Question = MultipleChoice | TrueFalse | FillInBlank;

abstract class TesterABC {
    abstract questionStructure: string;

    protected chatbotHandler: DeepseekAPI;
    protected content: string;

    constructor(chatbotHandler: DeepseekAPI, content: string) {
        this.chatbotHandler = chatbotHandler;
        this.content = content;
    }

    public async getQuestions(amountOfQuestions: number): Promise<Question[]> {
        if (amountOfQuestions <= 0) {
            throw new Error("Amount of questions must be positive");
        }

        try {
            const context = `
            This is the structure of a single question: ${this.questionStructure}\n\n
            Give me a JSON consisting only of a LIST of these questions.
            DO NOT give me any explanations, or anything other than the JSON.
            Generate exactly ${amountOfQuestions} questions.`;
            const response = await this.chatbotHandler.sendToDeepseek(context, this.content);
            const jsonString = this.extractJson(response);
            const parsedQuestions = this.validateQuestions(JSON.parse(jsonString), amountOfQuestions);

            console.log(`Number of questions: ${parsedQuestions.length}`);
            return parsedQuestions;
        } catch (error) {
            console.error("Question generation failed:", error);
            throw new Error(`Question generation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // Helper methods
    private extractJson(response: string): string {
        // Handle both ```json ``` and plain JSON responses
        const jsonMatch = response.match(/```(?:json)?\n([\s\S]*?)\n```/)?.[1] ?? response;
        return jsonMatch.trim();
    }

    private validateQuestions(candidates: unknown[], expectedCount: number): Question[] {
        if (!Array.isArray(candidates)) {
            throw new Error("Expected an array of questions");
        }

        return candidates.slice(0, expectedCount).map((candidate, index) => {
            if (typeof candidate !== "object" || candidate === null) {
                throw new Error(`Question at index ${index} is not an object`);
            }

            // Type-safe validation with proper type narrowing
            const question = candidate as Record<string, unknown>;

            // First validate the base question property
            if (typeof question.question !== "string") {
                throw new Error(`Question at index ${index} has invalid 'question' field`);
            }

            // Multiple Choice validation
            if ("options" in question && "answer" in question) {
                if (!Array.isArray(question.options)) {
                    throw new Error(`MC question at ${index} has invalid options array`);
                }
                if (typeof question.answer !== "string" || !question.options.includes(question.answer)) {
                    throw new Error(`MC question at ${index} has invalid or missing answer`);
                }
                return {
                    question: question.question,
                    options: question.options as string[],
                    answer: question.answer as string
                } satisfies MultipleChoice;
            }

            // True/False validation
            if ("answer" in question && typeof question.answer === "boolean") {
                return {
                    question: question.question,
                    answer: question.answer
                } satisfies TrueFalse;
            }

            // Fill in Blank validation
            if ("answer" in question && Array.isArray(question.answer)) {
                return {
                    question: question.question,
                    answer: question.answer as string[]
                } satisfies FillInBlank;
            }

            throw new Error(`Question at index ${index} does not match any valid type`);
        });
    }
}

// Concrete implementations for each question type
class MultipleChoiceTester extends TesterABC {
    questionStructure = `
    - question: string
    - options: string[] (4 options)
    - answer: string (must match one option)
    `;
}

class TrueFalseTester extends TesterABC {
    questionStructure = `
    - question: string
    - answer: boolean
    `;
}

class FillInBlankTester extends TesterABC {
    questionStructure = `
    - question: string (with _____ for blanks)
    - answer: string[] (possible correct answers)
    `;
}

// Factory function for convenience
export function createTester(
    type: 'mc' | 'tf' | 'fib',
    chatbotHandler: DeepseekAPI,
    content: string
): TesterABC {
    switch (type) {
        case 'mc': return new MultipleChoiceTester(chatbotHandler, content);
        case 'tf': return new TrueFalseTester(chatbotHandler, content);
        case 'fib': return new FillInBlankTester(chatbotHandler, content);
        default: throw new Error("Invalid tester type");
    }
}