from google import genai
import os
from dotenv import load_dotenv
import unicodedata
from google.cloud import texttospeech
import json
import wave
import subprocess
from openai import OpenAI
from codeformattor import normalize_manim_code, replace_urls_with_local_paths, fix_variable_names
import re
import base64
import time
from pdf_tools import remove_unicode
from image_uploader import upload_image_to_cloudinary

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

openAIClient = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url="https://integrate.api.nvidia.com/v1"
)

# openAIClient = OpenAI(
#     api_key=os.getenv("OPENAI_API_KEY"),
#     base_url="https://openrouter.ai/api/v1"
# )

AUDIO_PROMPT = """
You are an expert teacher.

You are given TEXT from a SINGLE PAGE of study material.

-------------------------
TASK
-------------------------
- Understand the content deeply
- Identify the key concept(s) on this page
- Organize the explanation logically

-------------------------
NARRATION RULES
-------------------------
- Explain like a teacher speaking aloud
- Keep it natural, clear, and easy to follow
- Do not read the text word-by-word — explain it
- Expand slightly where needed for clarity
- Maintain correct technical meaning
- If a diagram or setup is mentioned, explain it conceptually
- Keep the flow smooth as if teaching a student

-------------------------
MULTIMODAL UNDERSTANDING RULE
-------------------------
- Images are provided along with the text for this page.
- Use the images to better understand diagrams, components, and visual structures.
- Always align your explanation with BOTH text and images.
- If the text and image differ, prioritize what is visually present in the image.
- Do NOT ignore images even if text is available.

- Prefer explaining visible components (blocks, arrows, labels) step-by-step when diagrams are present.

-------------------------
CHARACTER NORMALIZATION (VERY IMPORTANT)
-------------------------
- Use ONLY basic ASCII characters
- Replace special characters:
  - “ ” → "
  - ‘ ’ → '
  - — or – → -
  - … → ...
- Avoid any Unicode escape sequences like \\u2014, \\u2019, etc.
- Output must be clean and TTS-friendly

-------------------------
STRICT OUTPUT RULES
-------------------------
- Return ONLY a clean narration text string
- No JSON, no labels, no headings
- No bullet points or formatting
- No extra commentary before or after

-------------------------
IMPORTANT EDGE CASE RULE
-------------------------
- If the text content is too short, unclear, or not meaningful (e.g., only one word like "Base"), then rely on the image (if provided) to understand the content.
- If both text and image lack sufficient information, respond with a brief, safe explanation of what is visible WITHOUT inventing unrelated concepts.
- NEVER generate unrelated topics.
"""

MANIM_PROMPT = """
You are a Manim animation engineer.

CRITICAL OUTPUT CONTRACT (HIGHEST PRIORITY)

1. Output ONLY valid Python code.
2. Do NOT output explanations, reasoning, or text outside code.
3. Do NOT rewrite or paraphrase narration text. Use EXACT text.
4. If ANY rule is violated, the output is INVALID.

CRITICAL TIMING RULE:

- You MUST ONLY use:
    self.wait(SENTENCE_X_SCENE_Y)

- NEVER use numbers inside wait()

INVALID (FORBIDDEN):
    self.wait(3)
    self.wait(2.5)

If you use numbers → OUTPUT IS INVALID.

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
DIAGRAM PATH ↔ IMAGE MAPPING (CRITICAL)
==================================================

- Each diagram path corresponds to an actual image provided separately.
- You MUST use the mapping to understand what each diagram contains.

- When selecting a diagram for a sentence:
  1. Read the sentence
  2. Look at available diagram paths
  3. Use the provided images to understand each diagram
  4. Choose the diagram whose VISUAL CONTENT matches the sentence

- DO NOT rely on file names.
- DO NOT guess diagram meaning.
- ALWAYS use the image content for decision making.

- When inserting into Manim:
  - Use ONLY the diagram path (NOT the URL)

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
- Make sure no objects should overlap unless intentional.
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
🎨 CONTROLLED CREATIVE VISUAL RULES (SAFE)
==================================================

You must enhance explanations using SIMPLE VISUAL ELEMENTS when appropriate.

⚠️ IMPORTANT:
- Creativity MUST NOT break syntax, timing, or structure.
- Visuals are OPTIONAL and must remain SIMPLE and SAFE.

--------------------------------------------------
🧠 WHEN TO ADD VISUALS
--------------------------------------------------

1. TYPES / LIST / CATEGORIES
Keywords:
    "types", "kinds", "categories", "main types", "classified as"

👉 MUST USE:
    Vertical structured layout (tree-style list)

--------------------------------------------------

2. COMPARISON / DIFFERENCE
Keywords:
    "difference", "relative vs absolute", "compared to", "on the other hand"

👉 MUST USE:
    Side-by-side comparison

--------------------------------------------------

3. FLOW / PROCESS / WORKING
Keywords:
    "process", "flow", "working", "steps", "how it works"

👉 MUST USE:
    Flow representation with arrows

--------------------------------------------------

4. COMPONENT BREAKDOWN
Keywords:
    "consists of", "components", "parts", "includes"

👉 MUST USE:
    Structured grouping (block diagram style)

--------------------------------------------------
🧱 ALLOWED VISUAL ELEMENTS (STRICT)
--------------------------------------------------

You may ONLY use:

- Circle
- Rectangle
- Arrow
- Line
- VGroup
- Text
- ImageMobject (only if valid path exists)

❌ DO NOT use:
- Unknown classes
- Complex diagrams
- Custom shapes
- Any unsupported Manim object

--------------------------------------------------
🔤 VARIABLE NAMING (CRITICAL)
--------------------------------------------------

ALL variable names MUST:

- Use lowercase English letters only
- Use underscores (_) for separation
- Follow this format:

    text_1, circle_1, rect_1, arrow_1, group_1

❌ INVALID:
    air Feel
    air-чувствует
    variable 1

--------------------------------------------------
🧩 OBJECT CREATION RULE (MANDATORY)
--------------------------------------------------

NEVER create objects inline.

❌ INVALID:
    Text(...).next_to(Circle(...))

✅ VALID:
    circle_1 = Circle()
    text_1 = Text("Humidity")
    text_1.next_to(circle_1, DOWN)

--------------------------------------------------
🔄 CONTINUITY (OPTIONAL BUT SAFE)
--------------------------------------------------

If 2 consecutive sentences are related:

- You MAY reuse existing objects
- OR replace them cleanly using FadeOut/FadeIn

DO NOT create large persistent layouts

--------------------------------------------------
📏 FRAME SAFETY FOR VISUALS
--------------------------------------------------

ALL visual groups MUST:

    group.set_width(config.frame_width * 0.8)

Ensure:
- No overflow
- Proper spacing

If visuals are not clearly helpful → USE TEXT ONLY

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
📏 STRICT LAYOUT SAFETY RULES (CRITICAL)
==================================================

You MUST ensure ZERO overlap between elements.

--------------------------------------------------
1. MAX HEIGHT CONTROL (MANDATORY)
--------------------------------------------------

ANY group (text + image or visuals) MUST NOT exceed:

    80% of frame height

After creating ANY group:

    group.set_height(config.frame_height * 0.8)

--------------------------------------------------
2. SPACING RULE (MANDATORY)
--------------------------------------------------

When using VGroup.arrange():

    ALWAYS use spacing:

    arrange(DOWN, buff=0.5)
    arrange(RIGHT, buff=1)

NEVER use default spacing.

--------------------------------------------------
3. TEXT LENGTH CONTROL (CRITICAL)
--------------------------------------------------

If a sentence is TOO LONG:

❌ DO NOT put entire sentence in one Text()

✅ SPLIT into 2 smaller parts:

Example:

text_1a = Text("Absolute humidity measures...")
text_1b = Text("in grams per cubic meter.")

group = VGroup(text_1a, text_1b).arrange(DOWN, buff=0.3)

--------------------------------------------------
4. IMAGE + TEXT LAYOUT RULE
--------------------------------------------------

When combining image and text:

- Image height MUST be limited:

    image.set_height(config.frame_height * 0.5)

- Then group:

    group = VGroup(text, image).arrange(DOWN, buff=0.5)

- Then:

    group.set_height(config.frame_height * 0.8)

--------------------------------------------------
5. SINGLE TEXT RULE
--------------------------------------------------

If only text is shown:

    text.set_width(config.frame_width * 0.8)
    text.move_to(ORIGIN)

--------------------------------------------------
6. OVERFLOW PREVENTION (MANDATORY)
--------------------------------------------------

Before EVERY self.play():

- Ensure object is scaled
- Ensure object is centered

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
🚨 CRITICAL FAILURE CONDITION 🚨

If you use ANY numeric value inside self.wait(), your output is INVALID.

You MUST ONLY use placeholder constants in this exact format:
    SENTENCE_X_SCENE_Y

Examples:
    self.wait(SENTENCE_1_SCENE_1)
    self.wait(SENTENCE_2_SCENE_1)

❌ INVALID (WILL CAUSE SYSTEM FAILURE):
    self.wait(3)
    self.wait(6.58)
    self.wait(4.2 - 1)
    duration = 5

❌ DO NOT define placeholder variables:
    SENTENCE_1_SCENE_1 = 2.5

If you violate this rule, the code will crash.

YOU MUST FOLLOW THIS STRICTLY.

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
    audio_generation_start_time = time.time()
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
    audio_generation_end_time = time.time()
    print(f"Audio generated in {round(audio_generation_end_time - audio_generation_start_time, 2)} seconds at {output_path}")

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

def build_prompt_with_images(prompt: str, images: list[str]) -> str:
    content = []

    content.append({
        "type": "text",
        "text": prompt
    })

    for img_url in images:
        content.append({
            "type": "image_url",
            "image_url": {"url": img_url}
        })

    return [{
        "role": "user",
        "content": content
    }]

def estimate_max_tokens(page_data):
    total_sentences = sum(len(p["sentences"]) for p in page_data.values())
    
    tokens_per_sentence = 200
    overhead = 800
    
    estimate = total_sentences * tokens_per_sentence + overhead
    
    estimate = int(estimate * 1.3)
    
    return max(1500, min(estimate, 8000))

def make_manim_script(job_id: str, diagrams: list[str]) -> str:
    """
    Sends prompt to LLM to generate Manim code.
    """
    make_manim_script_start_time = time.time()
    
    job_dir = f"tmp/{job_id}"

    if not os.path.exists(job_dir):
        os.makedirs(job_dir)
    
    # pdf_file = client.files.upload(
    #     file=f"{job_dir}/input.pdf"
    # )
    # with open(f"{job_dir}/input.pdf", "rb") as f:
    #     pdf_base64 = base64.b64encode(f.read()).decode("utf-8")
    
    with open(f"{job_dir}/extracted_text.json", "r") as f:
        extracted_text_json = json.load(f)
    
    narration_json_object = {}
    diagram_to_image_mapping = {}
    # iterate each page in extracted_text_json and generate narration for each page using LLM
    for key, value in extracted_text_json.items():
        page_content = value
        
        images = []
        for diagram_path in diagrams:
            diagram_startswith = f"page{key.split('_')[1]}_"
            if diagram_startswith in diagram_path:
                image_url = upload_image_to_cloudinary(diagram_path)
                images.append(image_url)
                diagram_to_image_mapping[diagram_path] = image_url
                
        print(f"diagram_to_image_mapping for page {key}:", diagram_to_image_mapping)

        narration_gen_start_time = time.time()
        
        audio_gen_prompt = build_prompt_with_images(AUDIO_PROMPT + page_content, images)
        response = openAIClient.chat.completions.create(
            model="mistralai/ministral-14b-instruct-2512",
            temperature=1,
            top_p=1,
            max_tokens=16384,
            messages=audio_gen_prompt
        )

        narration_gen_end_time = time.time()
        
        print(f"LLM response received for page {key} in {round(narration_gen_end_time - narration_gen_start_time, 2)} seconds")
        msg = response.choices[0].message

        if msg.content:
            narration = msg.content.strip()
            clean_narration = remove_unicode(narration)
            narration_json_object[key] = clean_narration
        elif hasattr(msg, "reasoning_content") and msg.reasoning_content:
            print("Model returned reasoning instead of final output")
            narration = msg.reasoning_content.strip()
        else:
            raise ValueError("No usable response from LLM")

    with open(f"{job_dir}/narration_response.json", "w", encoding="utf-8") as f:
        json.dump(narration_json_object, f)
    
    # Temporary: Load narration from file for testing
    # narration = ""
    # with open(f"{job_dir}/narration_response.json", "r", encoding="utf-8") as f:
    #     narration = f.read()
        
    # For each page in narration JSON, generate audio
    os.makedirs(f"{job_dir}/narration_txt", exist_ok=True)
    for key, value in narration_json_object.items():
        # Create txt file for Piper input
        with open(f"{job_dir}/narration_txt/{key}_narration.txt", "a", encoding="utf-8") as f:
            f.write(value)
        generate_audio_from_text(value, f"{job_dir}/narration_txt/{key}_narration.txt", f"{job_dir}/{key}_narration.mp3") #output audio file - page_1_narration.mp3, etc.
    
    BATCH_SIZE = 1

    pages = list(narration_json_object.items())
    
    blocks = []

    for i in range(0, len(pages), BATCH_SIZE):
        batch_manim_generation_start_time = time.time()
        batch = dict(pages[i:i+BATCH_SIZE])

        # Build enhanced page data with sentence-level timing
        page_data = {}
        diagram_to_image_mapping_this_batch = {}
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
        
        for diagram in page_diagrams:
            if diagram in diagram_to_image_mapping:
                diagram_to_image_mapping_this_batch[diagram] = diagram_to_image_mapping[diagram]
        
        print("Diagram to image mapping for this batch:", diagram_to_image_mapping_this_batch)
    
        mapping_text = "\n".join([
            f"{path} -> {url}"
            for path, url in diagram_to_image_mapping_this_batch.items()
        ])
        user_prompt = f"""
                        Diagram Image Mapping:
                        {mapping_text}

                        Page Data:
                        {json.dumps(page_data, indent=2)}
                    """
        
        # manim_gen_prompt = build_prompt_with_images(prompt, list(diagram_to_image_mapping_this_batch.values()))
        max_tokens = estimate_max_tokens(page_data)
        print(f"Estimated max tokens for this batch: {max_tokens}")
        
        response = openAIClient.chat.completions.create(
            model="z-ai/glm4.7",
            # model="qwen/qwen3-coder-480b-a35b-instruct",
            # model="google/gemma-4-31b-it",
            # model="minimaxai/minimax-m2.7",
            temperature=1,
            top_p=1,
            max_tokens=max_tokens,
            messages = [
                {
                    "role": "system",
                    "content": MANIM_PROMPT
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ]
        )

        msg = response.choices[0].message

        if msg.content:
            output = msg.content.strip()
        elif hasattr(msg, "reasoning_content") and msg.reasoning_content:
            print("⚠️ Model returned reasoning instead of final output")
            output = msg.reasoning_content.strip()
        else:
            raise ValueError("No usable response from LLM")

        if output.startswith("```"):
            output = output.split("\n", 1)[1]
        if output.endswith("```"):
            output = output.rsplit("```", 1)[0]

        blocks.append(output)

        with open(f"{job_dir}/manim_code_batch_{i//BATCH_SIZE + 1}.py", "w", encoding="utf-8") as f:
            f.write(output)
        
        batch_manim_generation_end_time = time.time()
        print(f"Manim code generated for batch in {round(batch_manim_generation_end_time - batch_manim_generation_start_time, 2)} seconds")

    code = normalize_manim_code(blocks)
    code = replace_urls_with_local_paths(code, diagram_to_image_mapping)
    # code = fix_variable_names(code)

    
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
    for key, narration_text in narration_json_object.items():
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
            if page_key in narration_json_object:
                audio_path = f"{job_dir}/{page_key}_narration.mp3"
                total_duration = get_audio_duration(audio_path)
                sentences = estimate_sentence_durations(narration_json_object[page_key], total_duration)
                
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
    
    make_manim_script_end_time = time.time()
    print(f"Total Manim script generation time: {round(make_manim_script_end_time - make_manim_script_start_time, 2)} seconds")

    return code
