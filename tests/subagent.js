import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const strategyFiles = [
  'src/strategies/rsiOversold.js',
  'src/strategies/emaCrossover.js',
  'src/strategies/macdSignal.js',
];

async function reviewStrategy(client, filePath) {
  const code = readFileSync(join(rootDir, filePath), 'utf-8');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Review this trading strategy code for correctness. Score it out of 10, flag any issues, and suggest edge cases to test.\n\nFile: ${filePath}\n\n\`\`\`javascript\n${code}\n\`\`\`\n\nRespond in JSON format:\n{\n  "file": "...",\n  "score": 0-10,\n  "issues": ["..."],\n  "edgeCases": ["..."],\n  "summary": "..."\n}`,
      },
    ],
  });

  const text = response.content[0].text;
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : { file: filePath, score: 0, issues: ['Failed to parse response'], edgeCases: [], summary: text };
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key') {
    console.error('Set ANTHROPIC_API_KEY in .env to run the sub-agent review');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });
  const results = [];

  for (const file of strategyFiles) {
    console.log(`Reviewing ${file}...`);
    try {
      const review = await reviewStrategy(client, file);
      results.push(review);
      console.log(`  Score: ${review.score}/10`);
    } catch (err) {
      console.error(`  Error reviewing ${file}: ${err.message}`);
      results.push({ file, score: 0, issues: [err.message], edgeCases: [], summary: 'Review failed' });
    }
  }

  const outputPath = join(rootDir, 'subagent-report.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nReport saved to ${outputPath}`);
}

main();
