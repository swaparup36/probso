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
    import re
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
