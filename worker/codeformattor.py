import re


def sanitize_vgroup_with_images(code: str) -> str:
    """
    Replace VGroup(...) with Group(...) if it likely contains ImageMobject.
    This handles both direct and variable-based usage.
    """

    lines = code.split("\n")
    output = []

    image_vars = set()

    # First pass: detect variables assigned to ImageMobject
    for line in lines:
        match = re.search(r"(\w+)\s*=\s*ImageMobject\(", line)
        if match:
            image_vars.add(match.group(1))

    # Second pass: replace VGroup if it contains image variables
    for line in lines:
        if "VGroup(" in line:
            for var in image_vars:
                if var in line:
                    line = line.replace("VGroup(", "Group(")
                    break
        output.append(line)

    return "\n".join(output)

def rewrite_invalid_transforms(code: str) -> str:
    code = re.sub(
        r"ReplacementTransform\(\s*(text\d+)\s*,\s*(vgroup\d+)\s*\)",
        r"FadeOut(\1), FadeIn(\2)",
        code
    )
    return code

def normalize_manim_code(blocks: list[str]) -> str:
    final_lines = []
    scene_counter = 1
    import_added = False

    for block in blocks:
        lines = block.splitlines()

        for line in lines:
            stripped = line.strip()

            # Keep only ONE import
            if stripped == "from manim import *":
                if not import_added:
                    final_lines.append("from manim import *")
                    final_lines.append("")
                    import_added = True
                continue

            # Renumber scenes globally
            match = re.match(r"class\s+Scene\d+\(Scene\):", stripped)
            if match:
                final_lines.append(f"class Scene{scene_counter}(Scene):")
                scene_counter += 1
                continue

            final_lines.append(line)

        final_lines.append("")

    return "\n".join(final_lines)

def replace_urls_with_local_paths(code: str, mapping: dict) -> str:
    url_to_local = {url: path for path, url in mapping.items()}
    sorted_urls = sorted(url_to_local.keys(), key=len, reverse=True)

    for url in sorted_urls:
        local_path = url_to_local[url]

        safe_path = local_path.replace("\\", "/")

        escaped_url = re.escape(url)

        # Replace inside ImageMobject("...")
        code = re.sub(
            rf'ImageMobject\(\s*["\']{escaped_url}["\']\s*\)',
            lambda m: f'ImageMobject("{safe_path}")',
            code
        )

        # Replace raw string occurrences
        code = re.sub(
            rf'["\']{escaped_url}["\']',
            lambda m: f'"{safe_path}"',
            code
        )

    return code

import re

def fix_variable_names(code: str) -> str:
    # Replace invalid variable names (very basic cleanup)

    # Replace spaces in variable names
    code = re.sub(r'(\w+)\s+(\w+)\s*=', r'\1_\2 =', code)

    # Remove non-ascii variable names
    code = re.sub(r'[^\x00-\x7F]+', '', code)

    return code

SCENE_CLASS_RE = re.compile(
    r"^(\s*)class\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*Scene[^)]*)\)\s*:",
    re.MULTILINE,
)


def find_scene_class_names(code: str) -> list[str]:
    """Return the names of every Manim Scene-like class declared in `code`."""
    return [match.group(2) for match in SCENE_CLASS_RE.finditer(code)]


def normalize_manim_block(code: str, scene_name: str) -> str:
    """
    Normalize a single-scene Manim block.

    Keeps exactly one `from manim import *`, at the top, and renames the first
    Scene class to `scene_name` so the renderer always knows what to target.
    """
    lines = code.splitlines()
    body = []
    renamed = False

    for line in lines:
        if line.strip() == "from manim import *":
            continue

        if not renamed:
            match = SCENE_CLASS_RE.match(line)
            if match:
                line = f"{match.group(1)}class {scene_name}({match.group(3)}):"
                renamed = True

        body.append(line)

    while body and not body[0].strip():
        body.pop(0)

    return "\n".join(["from manim import *", ""] + body).rstrip() + "\n"
