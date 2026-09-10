import json
import os
import redis
import re
import cloudinary.uploader
import time

HUNK_HEADER_RE = re.compile(
    r"^@@+\s*-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s*@@",
    re.MULTILINE,
)



# Write status of a job
def write_status(jobId: str, status: str, progress: float, mode: str, r: redis.Redis = None):
    """
    Write job status to tmp/<id>/status.json and publish to Redis channel.
    """
    if (mode == "cli"):
        print(f"Job {jobId} status: {status}, progress: {progress*100:.2f}%")
    else:
        data = {"jobId": jobId,"status": status, "progress": progress*100}
        
        # Publish to Redis
        result = r.publish('job_status_channel', json.dumps(data))
        print(f"Redis publish returned: {result} subscribers received the message")

# Apply diff for patching erroneous manim script
def strip_code_fences(text: str) -> str:
    """Remove a surrounding ``` fence (with optional language tag) if present."""
    stripped = text.strip()
    if not stripped.startswith("```"):
        return text

    lines = stripped.split("\n")
    lines = lines[1:]
    if lines and lines[-1].strip().startswith("```"):
        lines = lines[:-1]
    return "\n".join(lines)

def looks_like_unified_diff(text: str) -> bool:
    return HUNK_HEADER_RE.search(strip_code_fences(text)) is not None

def parse_hunks(diff_text: str) -> list[dict]:
    """
    Parse a unified diff into hunks
    """
    hunks = []
    current = None

    for raw_line in diff_text.split("\n"):
        header = HUNK_HEADER_RE.match(raw_line)
        if header:
            current = {"old_start": int(header.group(1)), "lines": []}
            hunks.append(current)
            continue

        if current is None:
            # Preamble (---/+++/index/diff --git lines) before the first hunk.
            continue

        if raw_line.startswith(("--- ", "+++ ")):
            # A new file header ends the current hunk.
            current = None
            continue

        if raw_line.startswith("\\"):
            # "\ No newline at end of file"
            continue

        if raw_line.startswith(("+", "-", " ")):
            current["lines"].append((raw_line[0], raw_line[1:]))
        elif raw_line == "":
            # Models frequently emit bare empty lines for empty context lines.
            current["lines"].append((" ", ""))
        else:
            # Unprefixed line - treat as context, which is the common model slip.
            current["lines"].append((" ", raw_line))

    return [h for h in hunks if h["lines"]]

def _squash(line: str) -> str:
    return re.sub(r"\s+", "", line)

def _find_block(haystack: list[str], needle: list[str], hint: int) -> int:
    """
    Locate needle inside haystack, preferring the position closest to hint.
    Falls back to progressively looser comparisons. Returns -1 when not found.
    """
    if not needle:
        return max(0, min(hint, len(haystack)))

    limit = len(haystack) - len(needle)
    if limit < 0:
        return -1

    candidates = sorted(range(limit + 1), key=lambda i: (abs(i - hint), i))
    size = len(needle)

    for transform in (lambda l: l, lambda l: l.rstrip(), _squash):
        target = [transform(l) for l in needle]
        source = [transform(l) for l in haystack]
        for index in candidates:
            if source[index:index + size] == target:
                return index

    return -1

def _apply_hunk(lines: list[str], hunk: dict, offset: int) -> tuple[list[str], int]:
    old_block = [text for op, text in hunk["lines"] if op in (" ", "-")]
    new_block = [text for op, text in hunk["lines"] if op in (" ", "+")]
    hint = max(0, hunk["old_start"] - 1 + offset)

    index = _find_block(lines, old_block, hint)

    # Fuzz: drop leading/trailing pure-context lines and retry
    fuzz = 0
    trimmed = list(hunk["lines"])
    while index == -1 and fuzz < 3 and len(trimmed) > 1:
        if trimmed[0][0] == " ":
            trimmed = trimmed[1:]
        elif trimmed[-1][0] == " ":
            trimmed = trimmed[:-1]
        else:
            break
        fuzz += 1
        old_block = [text for op, text in trimmed if op in (" ", "-")]
        new_block = [text for op, text in trimmed if op in (" ", "+")]
        index = _find_block(lines, old_block, hint)

    if index == -1:
        preview = "\n".join(old_block[:6])
        raise Exception(
            f"Could not locate hunk context near line {hunk['old_start']}:\n{preview}"
        )

    updated = lines[:index] + new_block + lines[index + len(old_block):]
    new_offset = offset + (len(new_block) - len(old_block))
    return updated, new_offset

def apply_unified_diff(original: str, diff_text: str) -> str:
    """
    Apply diff_text to original and return the patched text
    """
    diff_text = strip_code_fences(diff_text)
    hunks = parse_hunks(diff_text)
    if not hunks:
        raise Exception("Diff contains no applicable hunks.")

    keep_trailing_newline = original.endswith("\n")
    lines = original.split("\n")
    if keep_trailing_newline:
        lines = lines[:-1]

    offset = 0
    for hunk in hunks:
        lines, offset = _apply_hunk(lines, hunk, offset)

    patched = "\n".join(lines)
    if keep_trailing_newline:
        patched += "\n"
    return patched

# Cloudinary upload
def upload_to_cloudinary(path, job_id=None, attempts=3):
    last = None
    
    # print the size of the file
    print(f"Uploading file {path} to Cloudinary, size: {os.path.getsize(path)} bytes")
    
    for i in range(attempts):
        try:
            return cloudinary.uploader.upload_large(
                path,
                folder="pdfvid",
                resource_type="video",   # upload_large defaults to "raw" if omitted
                chunk_size=6_000_000,
                timeout=120,
            )
        except Exception as e:
            last = e
            print(f"Cloudinary upload attempt {i+1}/{attempts} for job {job_id} failed: {e}")
            if i < attempts - 1:
                time.sleep(2 ** i)
    raise last
