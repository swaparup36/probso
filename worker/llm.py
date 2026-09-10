import os
from dotenv import load_dotenv
import unicodedata
import json
import wave
import subprocess
from codeformattor import replace_urls_with_local_paths
import re
import time
from pdf_tools import remove_unicode
from image_uploader import upload_image_to_cloudinary
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
from openai import OpenAI, APIConnectionError, APIStatusError
from codeformattor import sanitize_vgroup_with_images, rewrite_invalid_transforms
from codeformattor import normalize_manim_block, find_scene_class_names
from utils import apply_unified_diff, looks_like_unified_diff, strip_code_fences
from prompt import AUDIO_PROMPT, MANIM_PROMPT, MANIM_FIX_PROMPT

load_dotenv()

narration_model_id = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
code_generation_model_id = "nvidia/nemotron-3-ultra-550b-a55b"
client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.environ["NVIDIA_API_KEY"],
    max_retries=3,
)


LLM_MAX_ATTEMPTS = int(os.getenv("LLM_MAX_ATTEMPTS", "5"))
LLM_MAX_CONCURRENCY = int(os.getenv("LLM_MAX_CONCURRENCY", "4"))
LLM_RETRY_BASE_DELAY = float(os.getenv("LLM_RETRY_BASE_DELAY", "5"))
LLM_RETRY_MAX_DELAY = float(os.getenv("LLM_RETRY_MAX_DELAY", "60"))
RETRYABLE_STATUS_CODES = {408, 409, 425, 429, 500, 502, 503, 504}


def _retry_after_seconds(exc):
    """Honour a Retry-After header when the server sends a sane one."""
    response = getattr(exc, "response", None)
    headers = getattr(response, "headers", None)
    if not headers:
        return None
    try:
        seconds = float(headers.get("retry-after", ""))
    except (TypeError, ValueError):
        return None
    return seconds if 0 < seconds <= LLM_RETRY_MAX_DELAY else None

def complete_with_retry(description: str, **kwargs):
    """
    client.chat.completions.create() that waits out transient upstream failures.

    Retries on connection errors with exponential backoff and jitter;
    re-raises anything else straight away.
    """
    last_exc = None

    for attempt in range(1, LLM_MAX_ATTEMPTS + 1):
        try:
            return client.chat.completions.create(**kwargs)
        except APIStatusError as exc:
            if exc.status_code not in RETRYABLE_STATUS_CODES:
                raise
            last_exc = exc
            reason = f"HTTP {exc.status_code}"
            if exc.request_id:
                reason += f" (request {exc.request_id})"
            delay = _retry_after_seconds(exc)
        except APIConnectionError as exc:
            last_exc = exc
            reason = type(exc).__name__
            delay = None

        if attempt == LLM_MAX_ATTEMPTS:
            break

        if delay is None:
            delay = min(
                LLM_RETRY_BASE_DELAY * (2 ** (attempt - 1)), LLM_RETRY_MAX_DELAY
            )
            delay *= 0.75 + random.random() * 0.5  # +/-25% jitter

        print(
            f"{description}: {reason} - retrying in {round(delay, 1)}s "
            f"(attempt {attempt}/{LLM_MAX_ATTEMPTS})"
        )
        time.sleep(delay)

    print(f"{description}: giving up after {LLM_MAX_ATTEMPTS} attempts - {last_exc}")
    raise last_exc

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
    
    Returns list of dicts with 'text' and 'duration' keys
    """
    sentences = split_into_sentences(narration_text)
    
    if not sentences:
        return []
    
    # Calculate character count for each sentence
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

def build_prompt_with_images(prompt: str, images: list[str]) -> list[dict]:
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

def sanitize_code(raw_code: str, diagram_to_image_mapping: dict, narration_json_object: dict, job_dir: str, scene_name: str) -> str:
    code = normalize_manim_block(raw_code, scene_name)
    code = replace_urls_with_local_paths(code, diagram_to_image_mapping)


    # clean up Unicode characters and replace common problematic characters with ASCII equivalents
    code = code.replace("•", "-")  # bullet point
    code = code.replace("-", "-")  # en dash
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
                
                # If sentence index is within bounds - use calculated duration
                if sentence_num <= len(sentences):
                    wait_duration = max(0.1, sentences[sentence_num - 1]['duration'] - 1.0)
                else:
                    # Use average duration for remaining time
                    used_duration = sum(s['duration'] for s in sentences[:sentence_num-1])
                    remaining_duration = max(1.0, total_duration - used_duration)
                    wait_duration = max(0.1, remaining_duration - 1.0)
                
                code = code.replace(placeholder, str(round(wait_duration, 2)))
                print(f"Fallback replaced {placeholder} with {wait_duration}")

    code = code.encode('utf-8', errors='ignore').decode('utf-8')
    code = unicodedata.normalize('NFKD', code)
    
    # Fix VGroup with ImageMobject - replace with Group
    lines = code.split('\n')
    fixed_lines = []
    for line in lines:
        # If line has VGroup and contains ImageMobject argument, replace VGroup with Group
        if 'VGroup(' in line and 'ImageMobject' in line:
            line = line.replace('VGroup(', 'Group(')
        fixed_lines.append(line)
    code = '\n'.join(fixed_lines)
    
    code = sanitize_vgroup_with_images(code)
    code = rewrite_invalid_transforms(code)
    
    return code

def _generate_page_narration(key: str, page_content: str, diagrams: list[str]):
    """
    Narration for a single page, plus the Cloudinary URLs for its diagrams.

    Runs one per thread. Returns
    (key, narration or None, diagram -> image url mapping for this page).
    """
    images = []
    mapping = {}
    for diagram_path in diagrams:
        diagram_startswith = f"page{key.split('_')[1]}_"
        if diagram_startswith in diagram_path:
            image_url = upload_image_to_cloudinary(diagram_path)
            images.append(image_url)
            mapping[diagram_path] = image_url

    print(f"diagram_to_image_mapping for page {key}:", mapping)

    narration_gen_start_time = time.time()

    audio_gen_prompt = build_prompt_with_images(AUDIO_PROMPT + page_content, images)

    response = complete_with_retry(
        f"Narration for {key}",
        model=narration_model_id,
        messages=audio_gen_prompt,
        max_tokens=512,
    )

    narration_gen_end_time = time.time()
    print(f"LLM response received for page {key} in {round(narration_gen_end_time - narration_gen_start_time, 2)} seconds")

    msg = response.choices[0].message

    if msg.content:
        return key, remove_unicode(msg.content), mapping
    if hasattr(msg, "reasoning_content") and msg.reasoning_content:
        # Same as before: reasoning text is not usable narration, so the page is
        # left without one rather than narrated with the model's thinking.
        print(f"Model returned reasoning instead of final output for {key}")
        return key, None, mapping
    raise ValueError("No usable response from LLM")

def _generate_page_scene(page_key: str, narration_text: str, diagrams: list[str], diagram_to_image_mapping: dict, job_dir: str, scripts_dir: str):
    """
    Generate, sanitize and write the Manim script for a single page
    """
    page_number = int(page_key.split("_")[1])
    scene_name = f"Scene{page_number}"
    batch_manim_generation_start_time = time.time()

    audio_path = f"{job_dir}/{page_key}_narration.mp3"
    total_duration = get_audio_duration(audio_path)
    sentences = estimate_sentence_durations(narration_text, total_duration)

    page_diagrams = [d for d in diagrams if f"page{page_key.split('_')[1]}_" in d]

    # Send to LLM without duration info (only sentence text)
    page_data = {
        page_key: {
            "full_narration": narration_text,
            "sentences": [{"text": s["text"]} for s in sentences],
            "diagrams": page_diagrams,
        }
    }

    print(f"Page data for AI ({page_key}):", json.dumps(page_data, indent=2))

    diagram_to_image_mapping_this_page = {
        diagram: diagram_to_image_mapping[diagram]
        for diagram in page_diagrams
        if diagram in diagram_to_image_mapping
    }
    print(f"Diagram to image mapping for {page_key}:", diagram_to_image_mapping_this_page)

    mapping_text = "\n".join([
        f"{path} -> {url}"
        for path, url in diagram_to_image_mapping_this_page.items()
    ])
    user_prompt = f"""
                    Diagram Image Mapping:
                    {mapping_text}

                    Page Data:
                    {json.dumps(page_data, indent=2)}
                """

    response = complete_with_retry(
        f"Manim code for {page_key}",
        model=code_generation_model_id,
        messages = [
            {
                "role": "system",
                "content": MANIM_PROMPT
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],
    )

    msg = response.choices[0].message

    if msg.content:
        output = msg.content
    elif hasattr(msg, "reasoning_content") and msg.reasoning_content:
        print(f"Model returned reasoning instead of final output for {page_key}")
        output = msg.reasoning_content.strip()
    else:
        raise ValueError("No usable response from LLM")

    output = strip_code_fences(output)

    # Keep the raw block for debugging purpose
    raw_script_path = os.path.join(scripts_dir, f"raw_manim_scene_{page_number}.py")
    with open(raw_script_path, "w", encoding="utf-8") as f:
        f.write(output)

    code = sanitize_code(
        output,
        diagram_to_image_mapping_this_page,
        {page_key: narration_text},
        job_dir,
        scene_name,
    )

    script_path = os.path.join(scripts_dir, f"manim_scene_{page_number}.py")
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(code)

    declared_scenes = find_scene_class_names(code)
    if scene_name not in declared_scenes:
        print(
            f"WARNING: {script_path} declares {declared_scenes} but "
            f"{scene_name} was expected."
        )

    batch_manim_generation_end_time = time.time()
    print(f"Manim code generated for page {page_number} in {round(batch_manim_generation_end_time - batch_manim_generation_start_time, 2)} seconds")

    return {
        "page": page_number,
        "page_key": page_key,
        "scene_name": scene_name,
        "script_path": script_path,
        "raw_script_path": raw_script_path,
        "audio_path": audio_path,
    }

def make_manim_script(job_id: str, diagrams: list[str]):
    """
    Sends prompt to LLM to generate Manim code
    """
    make_manim_script_start_time = time.time()
    
    job_dir = f"tmp/{job_id}"

    if not os.path.exists(job_dir):
        os.makedirs(job_dir)
    
    with open(f"{job_dir}/extracted_text.json", "r") as f:
        extracted_text_json = json.load(f)
    
    diagram_to_image_mapping = {}
    pages_in_order = list(extracted_text_json.items())

    # One narration call per page
    narration_by_key = {}
    with ThreadPoolExecutor(
        max_workers=min(LLM_MAX_CONCURRENCY, max(1, len(pages_in_order)))
    ) as executor:
        futures = [
            executor.submit(_generate_page_narration, key, value, diagrams)
            for key, value in pages_in_order
        ]
        for future in as_completed(futures):
            key, narration, mapping = future.result()
            narration_by_key[key] = narration
            diagram_to_image_mapping.update(mapping)

    # Rebuilt in page order: everything downstream reads this dict in sequence.
    narration_json_object = {
        key: narration_by_key[key]
        for key, _ in pages_in_order
        if narration_by_key.get(key)
    }

    with open(f"{job_dir}/narration_response.json", "w", encoding="utf-8") as f:
        json.dump(narration_json_object, f)
        
    # For each page in narration JSON generate audio
    os.makedirs(f"{job_dir}/narration_txt", exist_ok=True)
    for key, value in narration_json_object.items():
        # Create txt file for Piper input
        with open(f"{job_dir}/narration_txt/{key}_narration.txt", "a", encoding="utf-8") as f:
            f.write(value)
        generate_audio_from_text(value, f"{job_dir}/narration_txt/{key}_narration.txt", f"{job_dir}/{key}_narration.mp3") #output audio file - page_1_narration.mp3, etc.
    

    pages = list(narration_json_object.items())

    scenes = []

    scripts_dir = os.path.join(job_dir, "scenes")
    os.makedirs(scripts_dir, exist_ok=True)

    # Generate Manim scripts for each page concurrently
    with ThreadPoolExecutor(
        max_workers=min(LLM_MAX_CONCURRENCY, max(1, len(pages)))
    ) as executor:
        futures = [
            executor.submit(
                _generate_page_scene,
                page_key,
                narration_text,
                diagrams,
                diagram_to_image_mapping,
                job_dir,
                scripts_dir,
            )
            for page_key, narration_text in pages
        ]
        for future in as_completed(futures):
            scenes.append(future.result())

    # Completion order is arbitrary; the manifest must be in page order.
    scenes.sort(key=lambda scene: scene["page"])

    # Manifest so the render stage knows exactly which script holds which scene.
    with open(os.path.join(scripts_dir, "scenes.json"), "w", encoding="utf-8") as f:
        json.dump(scenes, f, indent=2)

    make_manim_script_end_time = time.time()
    print(f"Total Manim script generation time: {round(make_manim_script_end_time - make_manim_script_start_time, 2)} seconds")

    return scenes

def request_manim_fix_diff(code: str, scene_name: str, error_text: str) -> str:
    """
    Send a request to the LLM to generate a unified diff that fixes the given Manim code error. 
    The LLM is expected to return a unified diff that can be applied to the original code to fix the error.
    """
    user_prompt = f"""Scene class name (must not change): {scene_name}

                    FAILING FILE:
                    ```python
                    {code}
                    ```

                    MANIM ERROR OUTPUT:
                    ```
                    {error_text}
                    ```

                    Return ONLY the unified diff that fixes this error.
                """

    response = complete_with_retry(
        f"Fix diff for {scene_name}",
        model=code_generation_model_id,
        messages=[
            {"role": "system", "content": MANIM_FIX_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )

    msg = response.choices[0].message

    if msg.content:
        return msg.content
    if hasattr(msg, "reasoning_content") and msg.reasoning_content:
        print("Model returned reasoning instead of final output")
        return msg.reasoning_content.strip()

    raise ValueError("No usable response from LLM")

def repair_manim_script(script_path: str, scene_name: str, error_text: str, attempt: int = 1) -> bool:
    """
    Apply an LLM-generated fix to a Manim scene script that failed to render
    """
    try:
        with open(script_path, "r", encoding="utf-8") as f:
            original = f.read()
    except OSError as exc:
        print(f"Could not read {script_path} for repair: {exc}")
        return False

    repair_start_time = time.time()
    try:
        raw_response = request_manim_fix_diff(original, scene_name, error_text)
    except Exception as exc:
        print(f"LLM fix request failed for {scene_name}: {exc}")
        return False

    repairs_dir = os.path.join(os.path.dirname(script_path) or ".", "repairs")
    os.makedirs(repairs_dir, exist_ok=True)
    diff_path = os.path.join(repairs_dir, f"{scene_name}_attempt_{attempt}.diff")
    with open(diff_path, "w", encoding="utf-8") as f:
        f.write(raw_response)

    if looks_like_unified_diff(raw_response):
        try:
            patched = apply_unified_diff(original, raw_response)
        except Exception as exc:
            print(f"Could not apply LLM diff for {scene_name}: {exc}")
            return False
    else:
        candidate = strip_code_fences(raw_response).strip()
        if "def construct" not in candidate:
            print(f"LLM response for {scene_name} was neither a diff nor Manim code.")
            return False
        print(f"LLM returned a full file for {scene_name}; using it as a replacement.")
        patched = candidate + "\n"

    patched = normalize_manim_block(patched, scene_name)
    patched = sanitize_vgroup_with_images(patched)

    if patched.strip() == original.strip():
        print(f"LLM fix for {scene_name} did not change anything.")
        return False

    try:
        compile(patched, script_path, "exec")
    except SyntaxError as exc:
        print(f"Patched {scene_name} is not valid Python ({exc}); discarding fix.")
        return False

    # Keep the pre-fix version around before overwriting.
    backup_path = os.path.join(repairs_dir, f"{scene_name}_attempt_{attempt}_before.py")
    with open(backup_path, "w", encoding="utf-8") as f:
        f.write(original)

    with open(script_path, "w", encoding="utf-8") as f:
        f.write(patched)

    print(
        f"Applied LLM fix to {scene_name} (attempt {attempt}) in "
        f"{round(time.time() - repair_start_time, 2)} seconds; diff saved at {diff_path}"
    )
    return True
