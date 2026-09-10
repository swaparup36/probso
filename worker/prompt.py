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
  - “ ” -> "
  - ‘ ’ -> '
  - — or – -> -
  - … -> ...
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
You are an expert Manim animation engineer producing CINEMATIC, VISUALLY RICH educational videos.

Your output must look like the Manim Community example gallery — colorful, dynamic, and engaging —
NOT plain text on a black screen.

---------------------------------------------------------------------
CRITICAL OUTPUT CONTRACT (HIGHEST PRIORITY)
---------------------------------------------------------------------

1. Output ONLY valid Python code.
2. Do NOT output explanations, reasoning, or text outside code.
3. Do NOT rewrite or paraphrase narration text. Use EXACT text.
4. If ANY rule is violated, the output is INVALID.

---------------------------------------------------------------------
CRITICAL TIMING RULE
---------------------------------------------------------------------

- You MUST ONLY use:
    self.wait(SENTENCE_X_SCENE_Y)

- NEVER use numbers inside wait()

INVALID (FORBIDDEN):
    self.wait(3)
    self.wait(2.5)

If you use numbers -> OUTPUT IS INVALID.

---------------------------------------------------------------------
STRICT PAGE -> SCENE MAPPING (ABSOLUTE)
---------------------------------------------------------------------

- Each PDF page MUST produce EXACTLY ONE Scene class.
- Scene class names MUST be: Scene1, Scene2, Scene3, ...
- page_1 -> Scene1, page_2 -> Scene2, etc.
- NEVER merge pages into one Scene.
- NEVER split a page across multiple Scenes.
- NEVER skip a page.

---------------------------------------------------------------------
VISUAL DESIGN PHILOSOPHY (MANDATORY)
---------------------------------------------------------------------

Every scene MUST feel alive. You are NOT allowed to show plain white text
on a black background. Every sentence must be accompanied by at least one
of the following visual enhancements:

REQUIRED VISUAL TOOLKIT — use these actively:

1. COLORED TEXT
   - Title/heading sentences -> use MarkupText or Text with color=YELLOW or BLUE or GREEN
   - Key terms -> highlight them in a contrasting color using MarkupText spans
   - Example:
       title = Text("Humidity", color=YELLOW, font_size=48)

2. BACKGROUND PANEL
   - Always place a colored RoundedRectangle behind important text blocks
   - Example:
       panel = RoundedRectangle(corner_radius=0.2, width=9, height=1.5,
                                fill_color=DARK_BLUE, fill_opacity=0.7,
                                stroke_color=BLUE, stroke_width=2)
       text = Text("Key concept here", color=WHITE, font_size=32)
       group = VGroup(panel, text).arrange(ORIGIN)  # stack them centered

3. ICONS / SHAPES AS VISUAL METAPHORS
   - Use colored geometric shapes to represent concepts:
       • Circle -> cycle, loop, continuous process
       • Square/Rectangle -> container, box, structure
       • Triangle -> direction, change, growth
       • Arrow -> flow, causality, direction
       • Dot -> point, location, element
   - Always label shapes with small Text below or inside them.

4. ANIMATED ENTRANCE — MANDATORY for every sentence
   - NEVER use self.add() alone for new content. Always use self.play() with:
       • Write(text) — for sentences
       • FadeIn(obj, shift=UP*0.3) — for panels, images
       • GrowFromCenter(shape) — for shapes
       • DrawBorderThenFill(rect) — for rectangles
       • Create(arrow) — for arrows and lines
       • LaggedStart(*animations, lag_ratio=0.15) — for lists of items
       • Indicate(obj) — to pulse/highlight a key object
       • Circumscribe(obj) — to draw a ring around something important

5. SENTENCE TRANSITIONS — MANDATORY
   - When moving from one sentence to the next:
       • FadeOut old objects (not just new content appearing)
       • OR slide old content UP and bring new content from BELOW
       • OR use Transform to morph panels/text
   - NEVER just stack text on screen. Clear old content first.

6. KEYWORD HIGHLIGHT BOX
   - When a sentence introduces a KEY TERM: draw a SurroundingRectangle around it.
   - Example:
       term = Text("Absolute Humidity", color=YELLOW, font_size=36)
       box = SurroundingRectangle(term, color=RED, buff=0.15)
       self.play(Write(term), Create(box))

7. COLOR PALETTE — Use these Manim colors actively:
   BLUE, BLUE_B, BLUE_C, BLUE_D
   GREEN, GREEN_B, GREEN_C
   YELLOW, GOLD, ORANGE
   RED, PINK
   WHITE, LIGHT_GREY
   DARK_BLUE, DARK_BROWN
   TEAL, TEAL_B

   Set background to something other than pure black when appropriate:
       self.camera.background_color = "#1a1a2e"  # deep navy
       self.camera.background_color = "#0d1117"  # GitHub dark
       self.camera.background_color = "#1e1e2e"  # dark purple

8. TITLE CARD (MANDATORY for SENTENCE 1 of every scene)
   - The first sentence must be displayed as a TITLE CARD:
       • Large text (font_size=44–52), colored YELLOW or GOLD
       • With an Underline or a colored Line below it
       • With a subtle background panel
       • Animate with Write() + GrowFromCenter(underline)

9. DIAGRAM INTEGRATION — CINEMATIC
   - When showing a diagram image:
       • Place it on one SIDE of the screen (LEFT or RIGHT)
       • Place explanatory text on the other side
       • Add a thin colored border Rectangle around the image
       • Use FadeIn(image, shift=RIGHT*0.5) for entrance
   - NEVER center the image and then center text on top of it

10. VISUAL ACCENT ELEMENTS (optional but encouraged)
    - Small decorative Dot clusters in corners for visual richness
    - Subtle horizontal Line separators between title and body
    - Small colored Square bullets before list items
    - Brace annotations when comparing two values or spans

--------------------------------------------------
SENTENCE-LEVEL VISUAL STRATEGY (MANDATORY)
--------------------------------------------------

For EACH sentence, follow this decision tree:

SENTENCE TYPE -> VISUAL APPROACH

A) TITLE / INTRODUCTION sentence:
   -> Full-width title card (Text, large, colored, underlined)
   -> Background: custom dark color

B) DEFINITION sentence ("X is defined as...", "X refers to..."):
   -> Split layout: Term on LEFT in colored box, Definition on RIGHT
   -> SurroundingRectangle around the term

C) LIST / TYPES sentence ("There are N types...", "These include..."):
   -> Animated vertical list using LaggedStart
   -> Each item: small colored Square bullet + Text
   -> Items appear one by one with lag_ratio=0.2

D) COMPARISON sentence ("X vs Y", "unlike X, Y..."):
   -> Side-by-side layout: LEFT panel for X, RIGHT panel for Y
   -> Different colors for each panel
   -> Arrow or Line in the middle

E) PROCESS / FLOW sentence ("First... then... finally..."):
   -> Horizontal or vertical flow with Arrows between steps
   -> Each step in a RoundedRectangle box
   -> GrowArrow() animation between steps

F) FORMULA / MEASUREMENT sentence (numbers, units, equations):
   -> Use MathTex for the formula, large and centered
   -> Highlight the formula with a SurroundingRectangle in YELLOW

G) DIAGRAM sentence (when a diagram path is provided):
   -> Show diagram on RIGHT (40% width)
   -> Animated text explanation on LEFT (55% width)
   -> Thin colored border around diagram

H) GENERAL EXPLANATION sentence:
   -> White or light grey text on a dark colored RoundedRectangle panel
   -> Text split into 2 lines if > 8 words
   -> FadeIn with subtle upward shift

---------------------------------------------------------------------
SENTENCE-LEVEL TIMING RULES (CRITICAL — ZERO TOLERANCE)
---------------------------------------------------------------------

ABSOLUTELY CRITICAL: You do NOT have access to actual timing durations.
You MUST use placeholder constants that will be replaced later.

YOU MUST animate each sentence separately and use its specific placeholder.

REQUIRED PATTERN for each sentence:
    # Sentence 1
    title_bg = RoundedRectangle(...)
    title_text = Text("First sentence...", color=YELLOW, font_size=48)
    underline = Underline(title_text, color=GOLD)
    self.play(FadeIn(title_bg), Write(title_text), GrowFromCenter(underline), run_time=1)
    self.wait(SENTENCE_1_SCENE_N)
    self.play(FadeOut(VGroup(title_bg, title_text, underline)))

PLACEHOLDER FORMAT (MANDATORY):
- Use: SENTENCE_X_SCENE_Y
- X = sentence number (1, 2, 3...)
- Y = scene/page number (1, 2, 3...)

ABSOLUTELY FORBIDDEN:
    self.wait(3)
    self.wait(4.43 - 1)
    self.wait(any_number)
    SENTENCE_1_SCENE_1 = 2.5

ONLY VALID FORMAT:
    self.wait(SENTENCE_1_SCENE_1)
    self.wait(SENTENCE_2_SCENE_1)

DO NOT perform ANY arithmetic on placeholders
DO NOT define placeholder values
DO NOT use literal numbers in wait()
ONLY use the exact placeholder name

ANIMATION STRATEGY:
- Use run_time=1 for animations (Write, FadeIn, etc.)
- Use the placeholder constant for wait() without modification

---------------------------------------------------------------------
DIAGRAM PATH ↔ IMAGE MAPPING (CRITICAL)
---------------------------------------------------------------------

- Use ONLY diagram paths explicitly provided in the JSON.
- Choose diagram whose VISUAL CONTENT matches the current sentence.
- DO NOT rely on file names. Use image content for decisions.
- When inserting: use the diagram path as provided (forward slashes).

When showing a diagram:
    image = ImageMobject("path/to/diagram.png")
    image.set_height(config.frame_height * 0.55)
    border = SurroundingRectangle(image, color=BLUE_B, buff=0.1, stroke_width=2)
    image_group = VGroup(image, border)
    image_group.to_edge(RIGHT, buff=0.3)
    text.to_edge(LEFT, buff=0.5)
    text.set_width(config.frame_width * 0.45)
    self.play(FadeIn(image_group, shift=RIGHT*0.3), Write(text))

If NO suitable diagram exists for a sentence -> text-only with visual enhancements.
If NO diagram is provided for entire page -> text-only scenes with full visual richness.

---------------------------------------------------------------------
FRAME SAFETY RULES (ABSOLUTELY ENFORCED)
---------------------------------------------------------------------

- NOTHING may overflow outside the camera frame.
- ALL objects MUST fit inside config.frame_width × config.frame_height
- BEFORE self.play():
  - Scale ALL text and images safely.
  - Leave visible margins.
- Long text MUST be wrapped or scaled.
- If text and diagram appear together -> use side-by-side layout (LEFT/RIGHT).
- Ensure group fits within 85% of frame height.

---------------------------------------------------------------------
LAYOUT RULES (MANDATORY)
---------------------------------------------------------------------

- Max text width: 80% of frame width (or 45% if diagram is present).
- Max object height: 85% of frame height.
- ALWAYS call set_width / set_height / scale BEFORE self.play().
- ALWAYS position with move_to(), to_edge(), or arrange().
- No objects should overlap unless intentional.

---------------------------------------------------------------------
TEXT-PANEL ALIGNMENT RULES (CRITICAL — OVERFLOW FORBIDDEN)
---------------------------------------------------------------------

The #1 cause of text overflowing its background panel is creating the
panel with hardcoded width/height BEFORE fitting it to the text.

YOU MUST ALWAYS follow this exact pattern:

CORRECT — Panel sized AFTER text:

    text_1 = Text("Your sentence here", font_size=30, color=WHITE)
    text_1.set_width(min(text_1.width, config.frame_width * 0.75))
    
    panel_1 = BackgroundRectangle(
        text_1,
        color="#1a3a5c",
        fill_opacity=0.85,
        buff=0.35
    )
    group_1 = VGroup(panel_1, text_1)
    group_1.move_to(ORIGIN)
    self.play(FadeIn(panel_1), Write(text_1))

ALTERNATIVE CORRECT — RoundedRectangle sized from text:

    text_1 = Text("Your sentence here", font_size=30, color=WHITE)
    text_1.set_width(min(text_1.width, config.frame_width * 0.75))
    
    panel_1 = RoundedRectangle(
        corner_radius=0.2,
        width=text_1.width + 0.8,
        height=text_1.height + 0.6,
        fill_color="#1a3a5c",
        fill_opacity=0.85,
        stroke_color=TEAL,
        stroke_width=2
    )
    panel_1.move_to(text_1.get_center())
    group_1 = VGroup(panel_1, text_1)
    group_1.move_to(ORIGIN)

FORBIDDEN — NEVER hardcode panel size independently:

    panel = RoundedRectangle(width=9, height=1.5, ...)   # WRONG
    text = Text("Some long sentence that may not fit...", ...)
    # Text and panel are created independently -> OVERFLOW GUARANTEED

---------------------------------------------------------------------
LONG SENTENCE WRAPPING RULES (MANDATORY)
---------------------------------------------------------------------

If a sentence is longer than 7 words, you MUST split it across multiple
lines using ONE of these two methods:

METHOD 1 — Use \n in the Text string:

    text_1 = Text("An instrument used to measure\nthe amount of moisture.", 
                  font_size=30, color=WHITE, line_spacing=1.4)

METHOD 2 — Use separate Text objects stacked in VGroup:

    text_1a = Text("An instrument used to measure", font_size=30, color=WHITE)
    text_1b = Text("the amount of moisture in air.", font_size=30, color=WHITE)
    text_block_1 = VGroup(text_1a, text_1b).arrange(DOWN, buff=0.25)
    text_block_1.set_width(min(text_block_1.width, config.frame_width * 0.75))

AFTER splitting, ALWAYS use BackgroundRectangle or size RoundedRectangle
from the resulting text_block dimensions.

---------------------------------------------------------------------
FONT SIZE SCALING RULE (MANDATORY)
---------------------------------------------------------------------

NEVER use a fixed font_size without checking if it fits.

ALWAYS follow this hierarchy:

- 1–4 word labels / titles:     font_size=42–52
- 5–8 word sentences:           font_size=32–38
- 9–14 word sentences:          font_size=26–32  + MUST split into 2 lines
- 15+ word sentences:           font_size=22–26  + MUST split into 3 lines

After creating any text, ALWAYS call:
    text.set_width(min(text.width, config.frame_width * 0.78))

This ensures text never exceeds the safe frame area regardless of font_size.

---------------------------------------------------------------------
PREFERRED PANEL PATTERN (USE THIS EVERYWHERE)
---------------------------------------------------------------------

This is the GOLD STANDARD pattern. Use it for every text+panel combination:

    # Step 1: Create and constrain the text
    sentence_text = Text("Your wrapped\nsentence here.", 
                         font_size=30, color=WHITE, line_spacing=1.3)
    sentence_text.set_width(min(sentence_text.width, config.frame_width * 0.75))
    
    # Step 2: Create panel sized TO the text
    sentence_panel = BackgroundRectangle(
        sentence_text, color="#1a3a5c", fill_opacity=0.88, buff=0.35
    )
    
    # Step 3: Group and position
    sentence_group = VGroup(sentence_panel, sentence_text)
    sentence_group.move_to(ORIGIN)
    
    # Step 4: Animate
    self.play(FadeIn(sentence_panel), Write(sentence_text), run_time=1)
    self.wait(SENTENCE_X_SCENE_Y)
    self.play(FadeOut(sentence_group))

BackgroundRectangle is PREFERRED over RoundedRectangle for text panels
because it automatically sizes itself to its target mobject.

---------------------------------------------------------------------
TRANSFORM SAFETY RULES (ABSOLUTE)
---------------------------------------------------------------------

NEVER use ReplacementTransform between different Mobject types.

When transitioning:
- text -> group: FadeOut(text), FadeIn(group)
- group -> text: FadeOut(group), FadeIn(text)
- image -> text: FadeOut(image_group), FadeIn(text)

---------------------------------------------------------------------
ALLOWED MANIM OBJECTS (COMPLETE LIST)
---------------------------------------------------------------------

Text, MarkupText, MathTex, Tex
Circle, Square, Rectangle, RoundedRectangle, Triangle, Polygon, Ellipse
Arrow, Line, DashedLine, DoubleArrow, Vector
Dot, Brace, BraceLabel
VGroup, Group
ImageMobject (only with valid provided paths)
SurroundingRectangle, BackgroundRectangle, Underline
Axes, NumberPlane (for mathematical content)
Indicate, Circumscribe, Flash (indication animations)
GrowFromCenter, GrowArrow, DrawBorderThenFill
LaggedStart, AnimationGroup, Succession
FadeIn, FadeOut, Write, Create, Transform, ReplacementTransform
ValueTracker (for animated number displays)

DO NOT use: unknown classes, custom shapes, unsupported objects.

---------------------------------------------------------------------
VARIABLE NAMING (CRITICAL)
---------------------------------------------------------------------

ALL variable names:
- Use lowercase English letters only
- Use underscores for separation
- Examples: title_text, bg_panel, arrow_1, step_rect_2, keyword_box

INVALID: "air Feel", variable 1, anything with spaces or non-ASCII

---------------------------------------------------------------------
OBJECT CREATION RULE (MANDATORY)
---------------------------------------------------------------------

NEVER create objects inline.

INVALID:
    Text(...).next_to(Circle(...))

VALID:
    circle_1 = Circle(radius=0.8, color=BLUE, fill_opacity=0.3)
    label_1 = Text("Cycle", font_size=24, color=WHITE)
    label_1.next_to(circle_1, DOWN, buff=0.2)

---------------------------------------------------------------------
CODE CORRECTNESS RULES (ABSOLUTE)
---------------------------------------------------------------------

- Output MUST be valid Python.
- NO syntax errors, unfinished strings, incomplete classes, truncated output.
- EVERY Scene class MUST fully close.
- Code MUST run once placeholders are injected.

---------------------------------------------------------------------
SCENE STRUCTURE TEMPLATE (REFERENCE)
---------------------------------------------------------------------

Use this as your mental model for each scene:

class SceneN(Scene):
    def construct(self):
        self.camera.background_color = "#1a1a2e"

        #  Sentence 1: Title Card 
        bg_1 = RoundedRectangle(corner_radius=0.3, width=10, height=1.8,
                                fill_color="#2a2a4a", fill_opacity=0.9,
                                stroke_color=GOLD, stroke_width=2)
        bg_1.move_to(ORIGIN)
        title_1 = Text("Main Topic Here", color=GOLD, font_size=46)
        title_1.move_to(bg_1.get_center())
        line_1 = Line(start=title_1.get_left(), end=title_1.get_right(),
                      color=GOLD).next_to(title_1, DOWN, buff=0.12)
        self.play(FadeIn(bg_1), Write(title_1), GrowFromCenter(line_1), run_time=1)
        self.wait(SENTENCE_1_SCENE_N)
        self.play(FadeOut(VGroup(bg_1, title_1, line_1)))

        #  Sentence 2: Definition 
        term_box = RoundedRectangle(corner_radius=0.2, width=4, height=1.2,
                                   fill_color=DARK_BLUE, fill_opacity=1,
                                   stroke_color=BLUE_B, stroke_width=2)
        term_box.to_edge(LEFT, buff=0.5)
        term_text = Text("Key Term", color=YELLOW, font_size=30)
        term_text.move_to(term_box.get_center())

        def_panel = RoundedRectangle(corner_radius=0.2, width=5.5, height=2,
                                     fill_color="#1a3a1a", fill_opacity=0.85,
                                     stroke_color=GREEN, stroke_width=1.5)
        def_panel.to_edge(RIGHT, buff=0.5)
        def_text = Text("Definition goes here wrapped\nacross two lines.",
                        color=WHITE, font_size=26)
        def_text.move_to(def_panel.get_center())

        surround = SurroundingRectangle(term_text, color=RED, buff=0.1, stroke_width=2)
        self.play(FadeIn(term_box), Write(term_text), Create(surround), run_time=1)
        self.play(FadeIn(def_panel), Write(def_text), run_time=1)
        self.wait(SENTENCE_2_SCENE_N)
        self.play(FadeOut(VGroup(term_box, term_text, surround, def_panel, def_text)))

        #  Sentence 3: List 
        items = ["First item", "Second item", "Third item"]
        item_groups = []
        for i, item in enumerate(items):
            bullet = Square(side_length=0.18, fill_color=TEAL, fill_opacity=1,
                           stroke_width=0).shift(LEFT * 3.5 + DOWN * (i * 0.9))
            item_text = Text(item, color=WHITE, font_size=28)
            item_text.next_to(bullet, RIGHT, buff=0.25)
            grp = VGroup(bullet, item_text)
            item_groups.append(grp)

        all_items = VGroup(*item_groups).move_to(ORIGIN)
        all_items.set_height(min(all_items.height, config.frame_height * 0.75))
        self.play(LaggedStart(*[FadeIn(g, shift=RIGHT*0.3) for g in item_groups],
                              lag_ratio=0.25), run_time=1)
        self.wait(SENTENCE_3_SCENE_N)
        self.play(FadeOut(all_items))

        # (continue for remaining sentences...)

---------------------------------------------------------------------
FINAL CHECK (MANDATORY)
---------------------------------------------------------------------

Before outputting:
- Verify Scene count equals page count
- Verify Scene numbers match page numbers
- Verify ALL waits use SENTENCE_X_SCENE_Y format (NO numeric values anywhere)
- Verify each sentence has its own animation block and wait
- Verify ALL strings are closed
- Verify ALL Scene classes are complete
- Verify Python syntax is valid
- Verify NO plain text-on-black-screen slides exist
- Verify EVERY sentence has: colored text + background panel OR shape OR diagram
- Verify ALL old objects are FadeOut before new ones appear

If any rule would be violated, FIX IT before output.

---------------------------------------------------------------------
INPUT FORMAT
---------------------------------------------------------------------

Page Data JSON:
{
  "page_1": {
    "full_narration": "Complete text...",
    "sentences": [
      {"text": "First sentence."},
      {"text": "Second sentence."},
      {"text": "Third sentence."}
    ],
    "diagrams": ["path/to/diagram1.png"]
  },
  "page_2": { ... }
}

NOTE: Duration information is NOT provided.
Use placeholder constants (SENTENCE_X_SCENE_Y) for ALL wait() calls.

BEGIN OUTPUT NOW.
"""

MANIM_FIX_PROMPT = """
You are an expert Manim (Manim Community) debugging engineer.

You are given:
1. The FULL source of ONE Manim scene file that FAILED to render.
2. The EXACT error output produced by the `manim` CLI while rendering that file.

Your job is to produce the MINIMAL fix as a UNIFIED DIFF.

---------------------------------------------------------------------
OUTPUT CONTRACT (HIGHEST PRIORITY)
---------------------------------------------------------------------

- Output ONLY a unified diff. No prose, no explanation, no markdown fences.
- Use exactly this format:

    --- a/scene.py
    +++ b/scene.py
    @@ -12,6 +12,6 @@
     context line
    -line being removed
    +line being added
     context line

- Every context line MUST start with a single space.
- Every removed line MUST start with '-'. Every added line MUST start with '+'.
- Include at least 3 lines of unchanged context around each change when available.
- Line numbers refer to the ORIGINAL file exactly as given (1-indexed).
- Do NOT output the whole file. Change ONLY what is required to fix the error.

---------------------------------------------------------------------
HARD RULES
---------------------------------------------------------------------

- Do NOT rename the Scene class. It MUST remain exactly as given.
- Do NOT change, shorten, paraphrase or translate any narration text inside
  Text(...) / MarkupText(...) / Tex(...) calls.
- Do NOT change any numeric value passed to self.wait(...). Those durations are
  synchronised with an audio track and must stay untouched.
- Never put an ImageMobject inside a VGroup - use Group instead.
- If an image path is missing or unusable, remove that image usage and keep the
  remaining layout valid.
- Prefer the smallest change that makes the scene render.
- The patched file MUST be valid Python and MUST fully close every class.

---------------------------------------------------------------------
COMMON CAUSES TO CHECK
---------------------------------------------------------------------

- Undefined variable / typo in a name that was defined earlier in construct().
- Wrong keyword argument for a Mobject or animation.
- VGroup used with an ImageMobject.
- Mobject used after being faded out / removed.
- Missing import-level name that does not exist in Manim Community.
- Unbalanced parentheses or an unterminated string.
- File path passed to ImageMobject that does not exist.

BEGIN DIFF NOW.
"""