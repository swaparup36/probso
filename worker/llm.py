from google import genai
import os
from dotenv import load_dotenv
import unicodedata
from google.cloud import texttospeech
import json
import wave
import subprocess
from openai import OpenAI
from codeformattor import normalize_manim_code
import re
import base64

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

openAIClient = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

AUDIO_PROMPT = """
You are an expert teacher.

Read the ATTACHED PDF.

Your task is to generate clear spoken narration.

IMPORTANT PAGE SPLITTING RULE:
- If a single PDF page contains MORE THAN ONE distinct concept, section, or diagram,
  you MUST split the narration into MULTIPLE logical pages.
- Each concept or diagram should have its OWN narration entry.
- Maintain the original order of concepts as they appear on the page.
- If a page contains only one concept, keep it as a single narration.

Narration rules:
- Explain concepts like a teacher speaking aloud.
- Explain diagrams naturally when they appear.
- Do NOT mention equations symbol-by-symbol.
- Do NOT include any Manim or animation instructions.
- Keep the narration natural, continuous, and suitable for voice-over.

Output JSON in this format ONLY:

{
  "page_1": "spoken narration text for first concept or page...",
  "page_2": "spoken narration text for next concept...",
  "page_3": "spoken narration text..."
}

Notes:
- The output page numbering does NOT need to match the original PDF page numbers.
- The goal is ONE clear idea or diagram per output page.
"""

MANIM_PROMPT = """
You are a Manim animation engineer.

You are given:
1. Narration data for MULTIPLE PDF pages (MAXIMUM 2 pages)
2. Each page contains:
   - Full narration text
   - Sentence-level breakdown (TEXT ONLY - no durations visible to you)
3. Diagram image paths for EACH page

Narration is provided as a JSON object where:
- Keys are page numbers (page_1, page_2, ...)
- Values contain: full_narration, sentences array (text only), and diagrams

Your job:
- Generate EXACTLY ONE Manim Scene per page.
- Generate ALL required Scene classes in ONE output.
- Animate EACH SENTENCE separately with precise timing.
- Match visuals to the specific sentence being spoken.
- Use PLACEHOLDER CONSTANTS for all timing (see below).
- Do NOT invent explanations.
- Do NOT add extra content.

==================================================
STRICT PAGE → SCENE MAPPING (ABSOLUTE)
==================================================

- Each PDF page MUST produce EXACTLY ONE Scene class.
- Scene class names MUST be:
    Scene1, Scene2, Scene3, ...
- Page numbering MUST be respected:
    page_1 → Scene1
    page_2 → Scene2
- NEVER merge pages into one Scene.
- NEVER split a page across multiple Scenes.
- NEVER skip a page.

==================================================
FRAME SAFETY RULES (ABSOLUTELY ENFORCED)
==================================================

- NOTHING may overflow outside the camera frame.
- ALL objects MUST fit inside:
    config.frame_width
    config.frame_height
- BEFORE self.play():
  - Scale ALL text and images safely.
  - Leave visible margins.
- Long text MUST be wrapped or scaled.
- Diagrams MUST be scaled and centered safely.
- If text and diagram appear together:
  - Use vertical stacking ONLY:
        VGroup(...).arrange(DOWN)
  - Ensure the group fits within 80% of frame height.

==================================================
LAYOUT RULES (MANDATORY)
==================================================

- Max text width: 80% of frame width.
- Max object height: 80% of frame height.
- ALWAYS call set_width / set_height / scale BEFORE self.play().
- ALWAYS position with move_to(), to_edge(), or arrange().
- Prefer:
    text.set_width(config.frame_width * 0.8)
    image.set_height(config.frame_height * 0.6)

==================================================
SENTENCE-LEVEL TIMING RULES (CRITICAL — ZERO TOLERANCE)
==================================================

⚠️ ABSOLUTELY CRITICAL: You do NOT have access to actual timing durations.
You MUST use placeholder constants that will be replaced later.

YOU MUST animate each sentence separately and use its specific placeholder.

For each sentence in a page:
1. Display the visual elements for that sentence (text/diagram)
2. Wait using the PLACEHOLDER CONSTANT (never use numbers)
3. Then move to the next sentence

✅ REQUIRED PATTERN for each sentence:
    # Sentence 1
    text1 = Text("First sentence...")
    self.play(Write(text1), run_time=1)
    self.wait(SENTENCE_1_SCENE_N)
    
    # Sentence 2  
    text2 = Text("Second sentence...")
    self.play(FadeOut(text1), FadeIn(text2), run_time=1)
    self.wait(SENTENCE_2_SCENE_N)

PLACEHOLDER FORMAT (MANDATORY):
- Use: SENTENCE_X_SCENE_Y
- X = sentence number (1, 2, 3...)
- Y = scene/page number (1, 2, 3...)
- Example: SENTENCE_1_SCENE_1, SENTENCE_2_SCENE_1, SENTENCE_3_SCENE_2

❌ ABSOLUTELY FORBIDDEN - NEVER DO THIS:
    self.wait(3)
    self.wait(4.43 - 1)
    self.wait(8.12 - 1)
    self.wait(any_number)
    SENTENCE_1_SCENE_1 = 2.5
    duration = 4.5
    
✅ ONLY VALID FORMAT:
    self.wait(SENTENCE_1_SCENE_1)
    self.wait(SENTENCE_2_SCENE_1)
    self.wait(SENTENCE_3_SCENE_2)

⚠️ DO NOT perform ANY arithmetic on placeholders
⚠️ DO NOT define placeholder values
⚠️ DO NOT use literal numbers in wait()
⚠️ ONLY use the exact placeholder name

ANIMATION STRATEGY:
- Use run_time=1 for animations (Write, FadeIn, etc.)
- Use the placeholder constant for wait() without modification
- The system will inject the correct timing values later
    
==================================================
DIAGRAM SEMANTIC MATCHING RULES (ABSOLUTE)
==================================================

You MUST ensure that any diagram used MATCHES the current narration SENTENCE.

❌ NEVER use a diagram if it does not semantically match the current sentence.
❌ NEVER force a diagram just because one is available.
❌ NEVER reuse a diagram for unrelated sentences.

✅ Use a diagram ONLY IF:
- The diagram clearly illustrates the CURRENT sentence being spoken
- The diagram type matches the described concept in THAT sentence

TIMING STRATEGY FOR DIAGRAMS:
- Show diagram when its sentence starts
- Keep diagram visible for the full sentence duration
- If multiple sentences reference same diagram, keep it visible across those sentences
- Fade out diagram when moving to unrelated content

If NO suitable diagram is provided for a sentence:
- Animate TEXT ONLY for that sentence
- Do NOT add any ImageMobject
    
==================================================
TRANSFORM SAFETY RULES (ABSOLUTE)
==================================================

❌ NEVER use ReplacementTransform between different Mobject types.

❌ FORBIDDEN:
    ReplacementTransform(Text, Group)
    ReplacementTransform(Group, Text)
    ReplacementTransform(Text, ImageMobject)
    ReplacementTransform(ImageMobject, Text)

✅ When transitioning between:
    - text-only → text+diagram
    - text+diagram → text-only
    - text → group
    - group → text

You MUST use:
    FadeOut(old_object), FadeIn(new_object)

The generated code will be executed directly.
Invalid transforms will cause runtime failure.

==================================================
CODE CORRECTNESS RULES (ABSOLUTE)
==================================================

- Output MUST be valid Python.
- NO syntax errors.
- NO unfinished strings.
- NO incomplete classes.
- NO truncated output.
- EVERY Scene class MUST fully close.
- Code MUST run once placeholders are injected.

==================================================
MANIM USAGE RULES
==================================================

- Use Manim Community v0.19.1 syntax ONLY.
- Do NOT reuse the same Mobject instance across ReplacementTransform.
- Recreate text objects when replacing content.
- Image paths MUST use forward slashes (/).

==================================================
OUTPUT FORMAT (STRICT)
==================================================

- Output ONLY Python code.
- NO markdown.
- NO explanations.
- NO comments outside code.
- NO placeholder explanations.

==================================================
FILE SYSTEM & EXECUTION RULES (ABSOLUTE — ZERO TOLERANCE)
==================================================

⚠️ IMPORTANT:
The generated Manim code will be executed DIRECTLY.
NO manual edits will be made after generation.

❌ NEVER invent image file paths.
❌ NEVER guess diagram filenames.
❌ NEVER create placeholder paths.
❌ NEVER write comments like:
    - "Replace with real image path"
    - "Example diagram"
    - "Simulated diagram"
❌ NEVER reference files that are not explicitly provided.

✅ You MUST ONLY use diagram image paths that appear in the provided Diagrams JSON.
✅ If a narration sentence refers to a diagram but NO diagram path is provided:
    - Animate TEXT ONLY
    - DO NOT add any ImageMobject

❌ INVALID (FORBIDDEN):
    ImageMobject("wheatstone_bridge.png")
    ImageMobject("voltage_divider.png")
    ImageMobject("example.png")

✅ VALID:
    ImageMobject("tmp/job_001/diagrams/page9_img0.png")

If no valid image path exists for a page or sentence:
    - Use text-only animation
    - The Scene MUST still be generated

==================================================


Page Data JSON Format:
{{
  "page_1": {{
    "full_narration": "Complete text...",
    "sentences": [
      {{"text": "First sentence."}},
      {{"text": "Second sentence."}},
      {{"text": "Third sentence."}}
    ],
    "diagrams": ["path/to/diagram1.png", "path/to/diagram2.png"]
  }},
  "page_2": {{ ... }}
}}

NOTE: Duration information is NOT provided in the JSON.
You MUST use placeholder constants (SENTENCE_X_SCENE_Y) for all wait() calls.

Page Data:
{PAGE_DATA_JSON}

==================================================
FINAL CHECK (MANDATORY)
==================================================

Before outputting:
- Verify the number of Scene classes equals the number of pages
- Verify Scene numbers match page numbers
- Verify ALL waits use SENTENCE_X_SCENE_Y format (no numeric values)
- Verify each sentence has its own animation block and wait
- Verify ALL strings are closed
- Verify ALL Scene classes are complete
- Verify Python syntax is valid

If any rule would be violated, FIX IT before output.

BEGIN OUTPUT NOW.
"""


def split_into_sentences(text: str) -> list[str]:
    """
    Split text into sentences using regex.
    Handles common sentence endings: . ! ?
    """
    # Split on sentence endings followed by space or end of string
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    # Filter out empty strings
    return [s.strip() for s in sentences if s.strip()]

def generate_audio_from_text(text: str, input_path: str, output_path: str):
    process = subprocess.Popen(
        [
            "piper",
            "-m", "./models/en_US-lessac-medium.onnx",
            "-i", input_path,
            "-f", output_path
        ],
        stdin=subprocess.PIPE,
        text=True
    )

    process.communicate(text)

def get_audio_duration(path):
    with wave.open(path, "rb") as f:
        return f.getnframes() / f.getframerate()

def estimate_sentence_durations(narration_text: str, total_audio_duration: float) -> list[dict]:
    """
    Split narration into sentences and estimate duration for each based on proportion.
    
    Args:
        narration_text: Full narration text
        total_audio_duration: Total duration of the complete audio file
    
    Returns:
        List of dicts with 'text' and 'duration' keys
    """
    sentences = split_into_sentences(narration_text)
    
    if not sentences:
        return []
    
    # Calculate character count for each sentence (rough proxy for speaking time)
    char_counts = [len(s) for s in sentences]
    total_chars = sum(char_counts)
    
    if total_chars == 0:
        return []
    
    # Distribute duration proportionally based on character count
    sentence_data = []
    for i, sentence in enumerate(sentences):
        proportion = char_counts[i] / total_chars
        duration = total_audio_duration * proportion
        sentence_data.append({
            "text": sentence,
            "duration": round(duration, 2)
        })
    
    return sentence_data

def make_manim_script(job_id: str, diagrams: list[str]) -> str:
    """
    Sends prompt to LLM to generate Manim code.
    """
    
    job_dir = f"tmp/{job_id}"
    # pdf_file = client.files.upload(
    #     file=f"{job_dir}/input.pdf"
    # )
    with open(f"{job_dir}/input.pdf", "rb") as f:
        pdf_base64 = base64.b64encode(f.read()).decode("utf-8")
    
    response = openAIClient.chat.completions.create(
        model="openai/gpt-4.1",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": AUDIO_PROMPT
                    },
                    {
                        "type": "file",
                        "file": {
                            "filename": "input.pdf",
                            "file_data": f"data:application/pdf;base64,{pdf_base64}"
                        }
                    }
                ]
            }
        ]
    )
    
    narration = response.choices[0].message.content.strip()
    # Remove markdown narration fences if present
    if narration.startswith("```"):
        # Remove opening fence (e.g., ```json)
        narration = narration[narration.find("\n") + 1:]
    if narration.endswith("```"):
        # Remove closing fence
        narration = narration[:narration.rfind("```")].rstrip()

    with open(f"{job_dir}/narration_response.json", "w", encoding="utf-8") as f:
        f.write(narration)
    
    # Temporary: Load narration from file for testing
    # narration = ""
    # with open(f"{job_dir}/narration_response.json", "r", encoding="utf-8") as f:
    #     narration = f.read()
    
    # Extract only the first valid JSON object using JSONDecoder
    # This handles cases where file contains multiple JSON objects
    try:
        from json import JSONDecoder
        decoder = JSONDecoder()
        narration_json, end_idx = decoder.raw_decode(narration.lstrip())
        print(f"Successfully parsed JSON object ending at position {end_idx}")
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Narration content (first 500 chars): {narration[:500]}")
        raise
        
    # For each page in narration JSON, generate audio
    os.makedirs(f"{job_dir}/narration_txt", exist_ok=True)
    for key, value in narration_json.items():
        # Create txt file for Piper input
        with open(f"{job_dir}/narration_txt/{key}_narration.txt", "a", encoding="utf-8") as f:
            f.write(value)
        generate_audio_from_text(value, f"{job_dir}/narration_txt/{key}_narration.txt", f"{job_dir}/{key}_narration.mp3") #output audio file - page_1_narration.mp3, etc.
    
    BATCH_SIZE = 2

    pages = list(narration_json.items())
    
    blocks = []

    for i in range(0, len(pages), BATCH_SIZE):
        batch = dict(pages[i:i+BATCH_SIZE])

        # Build enhanced page data with sentence-level timing
        page_data = {}
        for key, narration_text in batch.items():
            page_num = key.split("_")[1]
            
            # Get audio duration for this page
            audio_path = f"{job_dir}/{key}_narration.mp3"
            total_duration = get_audio_duration(audio_path)
            
            # Get sentence-level breakdown
            sentences = estimate_sentence_durations(narration_text, total_duration)
            
            # Get diagrams for this page
            page_diagrams = [
                d for d in diagrams if f"page{page_num}_" in d
            ]
            
            # Send to AI WITHOUT duration info (only sentence text)
            page_data[key] = {
                "full_narration": narration_text,
                "sentences": [{"text": s["text"]} for s in sentences],  # Only text, no duration
                "diagrams": page_diagrams
            }

        print("Page data for AI:", json.dumps(page_data, indent=2))
    
        prompt = MANIM_PROMPT.format(
            PAGE_DATA_JSON=json.dumps(page_data, indent=2)
        )

        response = openAIClient.chat.completions.create(
            # model="openai/gpt-4.1",
            model="openai/gpt-5.2-pro",
            max_tokens=6000,
            messages=[{"role": "user", "content": prompt}]
        )

        output = response.choices[0].message.content.strip()

        if output.startswith("```"):
            output = output.split("\n", 1)[1]
        if output.endswith("```"):
            output = output.rsplit("```", 1)[0]

        blocks.append(output)

    code = normalize_manim_code(blocks)
    
    # Clean up Unicode characters
    # Replace common problematic characters with ASCII equivalents
    code = code.replace("•", "-")  # bullet point
    code = code.replace("–", "-")  # en dash
    code = code.replace("—", "-")  # em dash
    code = code.replace(""", '"')  # left double quote
    code = code.replace(""", '"')  # right double quote
    code = code.replace("'", "'")  # left single quote
    code = code.replace("'", "'")  # right single quote

    # Replace sentence-level timing placeholders with actual durations
    for key, narration_text in narration_json.items():
        scene_num = key.split('_')[1]
        audio_path = f"{job_dir}/{key}_narration.mp3"
        total_duration = get_audio_duration(audio_path)
        
        # Get sentence durations
        sentences = estimate_sentence_durations(narration_text, total_duration)
        
        # Replace each sentence placeholder
        for idx, sentence_data in enumerate(sentences, start=1):
            placeholder = f"SENTENCE_{idx}_SCENE_{scene_num}"
            # Subtract animation time (typically 1s) from sentence duration for wait time
            wait_duration = max(0.1, sentence_data['duration'] - 1.0)
            code = code.replace(placeholder, str(round(wait_duration, 2)))
            print(f"Replaced {placeholder} with {wait_duration}")

    # Fallback: Find any unreplaced SENTENCE_X_SCENE_Y placeholders
    # This handles cases where AI splits sentences differently than our regex
    unreplaced_pattern = r'SENTENCE_(\d+)_SCENE_(\d+)'
    unreplaced_matches = re.findall(unreplaced_pattern, code)
    
    if unreplaced_matches:
        print(f"Warning: Found {len(unreplaced_matches)} unreplaced placeholders")
        for sentence_num_str, scene_num_str in unreplaced_matches:
            sentence_num = int(sentence_num_str)
            scene_num = int(scene_num_str)
            placeholder = f"SENTENCE_{sentence_num}_SCENE_{scene_num}"
            
            # Find the corresponding page key
            page_key = f"page_{scene_num}"
            if page_key in narration_json:
                audio_path = f"{job_dir}/{page_key}_narration.mp3"
                total_duration = get_audio_duration(audio_path)
                sentences = estimate_sentence_durations(narration_json[page_key], total_duration)
                
                # If sentence index is within bounds, use calculated duration
                if sentence_num <= len(sentences):
                    wait_duration = max(0.1, sentences[sentence_num - 1]['duration'] - 1.0)
                else:
                    # Use average duration for remaining time
                    used_duration = sum(s['duration'] for s in sentences[:sentence_num-1])
                    remaining_duration = max(1.0, total_duration - used_duration)
                    wait_duration = max(0.1, remaining_duration - 1.0)
                
                code = code.replace(placeholder, str(round(wait_duration, 2)))
                print(f"Fallback replaced {placeholder} with {wait_duration}")

    
    # Remove any non-ASCII characters that can't be encoded in standard Python
    code = code.encode('utf-8', errors='ignore').decode('utf-8')
    
    # Normalize unicode to NFC form (combines characters properly)
    code = unicodedata.normalize('NFKD', code)
    
    # Fix VGroup with ImageMobject - replace with Group
    # Match patterns like VGroup(...ImageMobject...)
    lines = code.split('\n')
    fixed_lines = []
    for line in lines:
        # If line has VGroup and contains ImageMobject argument, replace VGroup with Group
        if 'VGroup(' in line and 'ImageMobject' in line:
            line = line.replace('VGroup(', 'Group(')
        fixed_lines.append(line)
    code = '\n'.join(fixed_lines)
    
    # open("manim_output_final_code.py", "w").write(code)
    
    # Temporary: Load final code from file for testing
    # code = ""
    # with open(f"{job_dir}/generated_manim.py", "r", encoding="utf-8") as f:
    #     code = f.read()

    return code
