const fs = require('fs');

const transcriptPath = "C:\\Users\\5500\\.gemini\\antigravity\\brain\\13b1e805-0a01-4b8d-bf44-2cb44017150e\\.system_generated\\logs\\transcript.jsonl";
const data = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (const line of data) {
  try {
    const obj = JSON.parse(line);
    if (obj.step_index === 866) {
      const toolCall = obj.tool_calls[0];
      const chunks = JSON.parse(toolCall.args.ReplacementChunks);
      console.log("CHUNK 0:");
      console.log(chunks[0].ReplacementContent);
      console.log("CHUNK 1:");
      console.log(chunks[1].ReplacementContent);
    }
  } catch(e) {}
}
