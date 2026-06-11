'use strict'

// Strict JSON schema — matches the Prisma Slide/Lesson models exactly.
// Used in Step 7 with output_config.format for Claude structured output.
const LESSON_JSON_SCHEMA = {
  type: 'object',
  required: ['lessonTitle', 'estimatedDuration', 'summary', 'keyTerms', 'slides'],
  additionalProperties: false,
  properties: {
    lessonTitle: { type: 'string' },
    estimatedDuration: { type: 'string' },
    summary: { type: 'string' },
    keyTerms: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 10,
    },
    slides: {
      type: 'array',
      minItems: 4,
      maxItems: 8,
      items: {
        type: 'object',
        required: ['slideNumber', 'slideTitle', 'explanation', 'narrationText', 'visualType', 'visualData'],
        additionalProperties: false,
        properties: {
          slideNumber: { type: 'integer', minimum: 1 },
          slideTitle: { type: 'string' },
          explanation: { type: 'string' },
          narrationText: { type: 'string' },
          visualType: {
            type: 'string',
            enum: ['DIAGRAM', 'CHART', 'EXAMPLE', 'ANALOGY', 'FORMULA', 'NONE'],
          },
          // visualData shape varies by visualType — documented below.
          // DIAGRAM:  { description: string, label: string, components: string[] }
          // CHART:    { chartType: string, data: { labels: string[], values: number[] }, xAxis: string, yAxis: string }
          // EXAMPLE:  { scenario: string, steps: string[] }
          // ANALOGY:  { realWorldObject: string, comparison: string }
          // FORMULA:  { formula: string, variables: [{ symbol: string, meaning: string }], explanation: string }
          // NONE:     {}
          visualData: { type: 'object' },
        },
      },
    },
  },
}

function buildLessonSystemPrompt() {
  return `You are an expert AI teacher creating structured lessons for students.

Your lessons must be clear, engaging, and pedagogically sound. Each lesson is split into slides that guide the student step by step.

VISUAL TYPE GUIDE (choose the best fit for each slide):
• DIAGRAM   — processes, systems, cause-and-effect. visualData: { description, label, components: string[] }
• CHART     — numerical comparisons. visualData: { chartType, data: { labels, values }, xAxis, yAxis }
• EXAMPLE   — step-by-step demonstrations. visualData: { scenario, steps: string[] }
• ANALOGY   — abstract concepts. visualData: { realWorldObject, comparison }
• FORMULA   — equations. visualData: { formula, variables: [{ symbol, meaning }], explanation }
• NONE      — summary or recap slides. visualData: {}

RULES:
- Use simple, age-appropriate language for the specified grade level.
- narrationText must sound natural when read aloud — write it as a teacher speaking to a student.
- explanation must be concise and factually accurate.
- Vary the visualTypes across slides — do not repeat the same type more than twice.
- Always end with a NONE summary slide.
- Do not include quiz questions, exercises, or homework in the slides.
- English only.`
}

function buildLessonUserPrompt(topic, subject, gradeLevel) {
  return `Create a structured lesson for Grade ${gradeLevel} students.

Topic: ${topic}
Subject: ${subject}
Target audience: Grade ${gradeLevel} students

Requirements:
- 5 to 7 slides total
- Slide 1: definition / introduction
- Middle slides: core concepts, mechanism, and real-world applications
- Final slide: summary and key takeaways (visualType: NONE)
- keyTerms: 4 to 8 terms specific to this topic

Return ONLY valid JSON that matches the schema. No markdown. No extra text.`
}

module.exports = { buildLessonSystemPrompt, buildLessonUserPrompt, LESSON_JSON_SCHEMA }
