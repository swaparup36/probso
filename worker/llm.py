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
1. Narration text for MULTIPLE PDF pages (MAXIMUM 2 pages)
2. Diagram image paths for EACH page

Narration is provided as a JSON object where:
- Keys are page numbers (page_1, page_2, ...)
- Values are narration text for that page

Your job:
- Generate EXACTLY ONE Manim Scene per page.
- Generate ALL required Scene classes in ONE output.
- Animate text and diagrams STRICTLY in narration order per page.
- Insert a wait AFTER every narration sentence.
- Do NOT invent explanations.
- Do NOT add extra content.
- One narration sentence = one animation block.

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
TIMING RULES (CRITICAL — ZERO TOLERANCE)
==================================================

❌ NEVER use numeric values in self.wait()
❌ NEVER estimate or compute durations
❌ NEVER assign values to numbers
❌ NEVER define timing constants
❌ NEVER use ellipses (...)

✅ You MUST use ONLY placeholder constants:
    AUDIO_DURATION_SCENE_N

- N MUST match the Scene number.
- Placeholders MUST NOT be defined.
- Placeholders MUST be used exactly like this:

    self.wait(AUDIO_DURATION_SCENE_1)

❌ INVALID (FORBIDDEN):
    self.wait(3)
    self.wait(21.5)
    AUDIO_DURATION_SCENE_1 = 21.5
    21.5 = ...
    self.wait(...)
    
==================================================
DIAGRAM SEMANTIC MATCHING RULES (ABSOLUTE)
==================================================

You MUST ensure that any diagram used MATCHES the current narration sentence.

❌ NEVER use a diagram if it does not semantically match the narration.
❌ NEVER force a diagram just because one is available.
❌ NEVER reuse a diagram for unrelated narration.

✅ Use a diagram ONLY IF:
- The diagram clearly illustrates the current sentence
- The diagram type matches the described concept

If NO suitable diagram is provided for a sentence:
- Animate TEXT ONLY
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


Narration JSON:
{PAGE_NARRATION_JSON}

Diagrams JSON:
{PAGE_DIAGRAMS_JSON}

==================================================
FINAL CHECK (MANDATORY)
==================================================

Before outputting:
- Verify the number of Scene classes equals the number of pages
- Verify Scene numbers match page numbers
- Verify NO numeric self.wait()
- Verify ALL strings are closed
- Verify ALL Scene classes are complete
- Verify Python syntax is valid

If any rule would be violated, FIX IT before output.

BEGIN OUTPUT NOW.
"""


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

def make_manim_script(job_id: str, diagrams: list[str]) -> str:
    """
    Sends prompt to LLM to generate Manim code.
    """
    
    job_dir = f"tmp/{job_id}"
    pdf_file = client.files.upload(
        file=f"{job_dir}/input.pdf"
    )
    
    narration_response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            {
                "role": "user",
                "parts": [
                    {
                        "file_data": {
                            "file_uri": pdf_file.uri,
                            "mime_type": "application/pdf",
                        }
                    },
                    {
                        "text": AUDIO_PROMPT
                    }
                ]
            }
        ]
    )
    
    narration = narration_response.text.strip()
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
        
    # For each page in narration JSON, generate audio
    narration_json = json.loads(narration)
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

        diagrams_batch = {}
        for key in batch.keys():
            page_num = key.split("_")[1]
            diagrams_batch[key] = [
                d for d in diagrams if f"page{page_num}_" in d
            ]

        print("Diagrams batch:", diagrams_batch)
        print("Narration batch:", batch)
    
        prompt = MANIM_PROMPT.format(
            PAGE_NARRATION_JSON=json.dumps(batch, indent=2),
            PAGE_DIAGRAMS_JSON=json.dumps(diagrams_batch, indent=2)
        )

        response = openAIClient.chat.completions.create(
            model="openai/gpt-4.1",
            max_tokens=2180,
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

    for key, value in narration_json.items():
        audio_duration = get_audio_duration(f"{job_dir}/{key}_narration.mp3")
        code = code.replace(
            f"AUDIO_DURATION_SCENE_{key.split('_')[1]}",
            str(audio_duration)
        )

    
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
    
    open("manim_output_final_code.py", "w").write(code)
    
    # Temporary: Load final code from file for testing
    # code = ""
    # with open(f"manim_output_final_code.py", "r", encoding="utf-8") as f:
    #     code = f.read()

    return code
