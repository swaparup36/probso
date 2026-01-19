from manim import *


class Scene1(Scene):
    def construct(self):
        # Sentence 1
        text1 = Text("Let's begin by understanding what a hygrometer is.")
        text1.set_width(config.frame_width * 0.8)
        text1.move_to(ORIGIN)
        self.play(FadeIn(text1))
        self.wait(36.710748299319725)
        
        # Sentence 2
        self.play(FadeOut(text1))
        text2 = Text("A hygrometer is an instrument specifically designed to measure humidity.")
        text2.set_width(config.frame_width * 0.8)
        text2.move_to(ORIGIN)
        self.play(FadeIn(text2))
        self.wait(36.710748299319725)
        
        # Sentence 3 - diagram semantically matches description of the tool and its functionality
        self.play(FadeOut(text2))
        text3 = Text("It's a versatile tool that can provide its output in terms of either absolute humidity or relative humidity, depending on the application and the type of instrument.")
        text3.set_width(config.frame_width * 0.8)
        diagram = ImageMobject("tmp/job_001/diagrams/page1_img0.png")
        diagram.set_height(config.frame_height * 0.4)
        group = Group(text3, diagram)
        group.arrange(DOWN, buff=0.5)
        group.set_height(config.frame_height * 0.8)
        group.move_to(ORIGIN)
        self.play(FadeIn(group))
        self.wait(36.710748299319725)

class Scene2(Scene):
    def construct(self):
        # Only one sentence and one diagram
        text1 = Text("As we just learned, the primary function of a hygrometer is to measure humidity.")
        text1.set_width(config.frame_width * 0.8)
        diagram = ImageMobject("tmp/job_001/diagrams/page2_img0.png")
        diagram.set_height(config.frame_height * 0.4)
        group = Group(text1, diagram)
        group.arrange(DOWN, buff=0.5)
        group.set_height(config.frame_height * 0.8)
        group.move_to(ORIGIN)
        self.play(FadeIn(group))
        self.wait(24.624761904761904)


class Scene3(Scene):
    def construct(self):
        narration_sentences = [
            "There are several different types of hygrometers, each employing a unique principle for measurement.",
            "These include the Resistive hygrometer, Capacitive hygrometer, Microwave hygrometer, Aluminum Oxide (Al. Oxide) hygrometer, and Crystal hygrometer.",
            "Today, we'll focus on the Resistive hygrometer."
        ]

        # First sentence: text only
        text1 = Text(
            narration_sentences[0],
            font_size=48
        )
        text1.set_width(config.frame_width * 0.8)
        text1.move_to(ORIGIN)
        self.play(FadeIn(text1))
        self.wait(36.710748299319725)

        # Second sentence: text only
        text2 = Text(
            narration_sentences[1],
            font_size=48
        )
        text2.set_width(config.frame_width * 0.8)
        text2.move_to(ORIGIN)
        self.play(FadeOut(text1), FadeIn(text2))
        self.wait(36.710748299319725)

        # Third sentence: introduce image + text
        text3 = Text(
            narration_sentences[2],
            font_size=48
        )
        text3.set_width(config.frame_width * 0.8)

        diagram_img = ImageMobject("tmp/job_001/diagrams/page3_img0.png")
        diagram_img.set_height(config.frame_height * 0.6)

        group = Group(text3, diagram_img)
        group.arrange(DOWN)
        group.set_height(config.frame_height * 0.8)
        group.move_to(ORIGIN)

        self.play(FadeOut(text2), FadeIn(group))
        self.wait(36.710748299319725)

        self.play(FadeOut(group))


class Scene4(Scene):
    def construct(self):
        narration_sentences = [
            "Now, let's delve into the construction of a Resistive Hygrometer.",
            "The setup typically consists of a few key components: first, Lithium Chloride, which acts as the crucial sensing element; second, electrodes that are coated with this Lithium Chloride material; third, a Wheatstone Bridge or a Voltage Divider circuit, which serves for signal conditioning; fourth, an AC or DC power supply to power the circuit; and finally, a display element to show the measured humidity."
        ]

        # First sentence: text only
        text1 = Text(
            narration_sentences[0],
            font_size=48
        )
        text1.set_width(config.frame_width * 0.8)
        text1.move_to(ORIGIN)
        self.play(FadeIn(text1))
        self.wait(24.624761904761904)

        # Second sentence: text + diagram
        text2 = Text(
            narration_sentences[1],
            font_size=48
        )
        text2.set_width(config.frame_width * 0.8)

        diagram_img = ImageMobject("tmp/job_001/diagrams/page4_img0.png")
        diagram_img.set_height(config.frame_height * 0.6)

        group = Group(text2, diagram_img)
        group.arrange(DOWN)
        group.set_height(config.frame_height * 0.8)
        group.move_to(ORIGIN)

        self.play(FadeOut(text1), FadeIn(group))
        self.wait(24.624761904761904)

        self.play(FadeOut(group))


class Scene5(Scene):
    def construct(self):
        # Sentence 1
        text1 = Text(
            "This diagram illustrates a basic representation of the sensing element in a resistive hygrometer.",
        )
        text1.set_width(config.frame_width * 0.8)
        text1.move_to(ORIGIN)
        # Diagram for sentence 1
        image1 = ImageMobject("tmp/job_001/diagrams/page5_img0.png")
        image1.set_height(config.frame_height * 0.6)
        group1 = Group(text1, image1)
        group1.arrange(DOWN)
        group1.set_height(config.frame_height * 0.8)
        group1.move_to(ORIGIN)
        self.play(FadeIn(group1))
        self.wait(36.710748299319725)
        # Sentence 2
        text2 = Text(
            "We see two main electrodes, which are then coated with Lithium Chloride, indicated as LiCl.",
        )
        text2.set_width(config.frame_width * 0.8)
        group2 = Group(text2, image1.copy())
        group2.arrange(DOWN)
        group2.set_height(config.frame_height * 0.8)
        group2.move_to(ORIGIN)
        self.play(FadeOut(group1), FadeIn(group2))
        self.wait(36.710748299319725)
        # Sentence 3
        text3 = Text(
            "These electrodes are typically mounted on a base, forming the core part of the sensor that interacts with the surrounding air to detect humidity.",
        )
        text3.set_width(config.frame_width * 0.8)
        group3 = Group(text3, image1.copy())
        group3.arrange(DOWN)
        group3.set_height(config.frame_height * 0.8)
        group3.move_to(ORIGIN)
        self.play(FadeOut(group2), FadeIn(group3))
        self.wait(36.710748299319725)
        self.play(FadeOut(group3))
        
class Scene6(Scene):
    def construct(self):
        # Sentence 1
        text1 = Text(
            "The working principle of a resistive hygrometer is centered around Lithium Chloride, or LiCl.",
        )
        text1.set_width(config.frame_width * 0.8)
        text1.move_to(ORIGIN)
        image1 = ImageMobject("tmp/job_001/diagrams/page6_img0.png")
        image1.set_height(config.frame_height * 0.6)
        group1 = Group(text1, image1)
        group1.arrange(DOWN)
        group1.set_height(config.frame_height * 0.8)
        group1.move_to(ORIGIN)
        self.play(FadeIn(group1))
        self.wait(24.624761904761904)
        # Sentence 2
        text2 = Text(
            "LiCl is a hygroscopic salt, meaning it readily absorbs moisture from the air.",
        )
        text2.set_width(config.frame_width * 0.8)
        group2 = Group(text2, image1.copy())
        group2.arrange(DOWN)
        group2.set_height(config.frame_height * 0.8)
        group2.move_to(ORIGIN)
        self.play(FadeOut(group1), FadeIn(group2))
        self.wait(24.624761904761904)
        # Sentence 3
        text3 = Text(
            "A key property of LiCl is that its electrical resistivity changes significantly with respect to the humidity it encounters.",
        )
        text3.set_width(config.frame_width * 0.8)
        group3 = Group(text3, image1.copy())
        group3.arrange(DOWN)
        group3.set_height(config.frame_height * 0.8)
        group3.move_to(ORIGIN)
        self.play(FadeOut(group2), FadeIn(group3))
        self.wait(24.624761904761904)
        # Sentence 4
        text4 = Text(
            "Therefore, when the LiCl-coated electrodes are exposed to humid air, their electrical resistance changes, and this change in resistance is directly related to the amount of humidity present in the surrounding air.",
        )
        text4.set_width(config.frame_width * 0.8)
        group4 = Group(text4, image1.copy())
        group4.arrange(DOWN)
        group4.set_height(config.frame_height * 0.8)
        group4.move_to(ORIGIN)
        self.play(FadeOut(group3), FadeIn(group4))
        self.wait(24.624761904761904)
        self.play(FadeOut(group4))


class Scene7(Scene):
    def construct(self):
        # Sentence 1
        text1 = Text("To understand the relationship, let's recall the basic formula for the resistance of a material.")
        text1.set_width(config.frame_width * 0.8)
        text1.move_to(ORIGIN)
        self.play(FadeIn(text1))
        self.wait(36.710748299319725)

        # Sentence 2 (with formula diagram)
        self.play(FadeOut(text1))
        text2 = Text("Resistance is given by the product of resistivity and the ratio of length to cross-sectional area.")
        text2.set_width(config.frame_width * 0.8)
        image2 = ImageMobject("tmp/job_001/diagrams/page7_img0.png")
        image2.set_height(config.frame_height * 0.6)
        group2 = Group(text2, image2)
        group2.arrange(DOWN, buff=0.6)
        group2.set_height(config.frame_height * 0.8)
        group2.move_to(ORIGIN)
        self.play(FadeIn(group2))
        self.wait(36.710748299319725)

        # Sentence 3 (explanation of variables)
        self.play(FadeOut(group2))
        text3 = Text("Here, 'rho' represents resistivity, 'l' is the length of the material, and 'A' is its cross-sectional area.")
        text3.set_width(config.frame_width * 0.8)
        self.play(FadeIn(text3))
        self.wait(36.710748299319725)
        self.play(FadeOut(text3))


class Scene8(Scene):
    def construct(self):
        # Sentence 1
        text1 = Text("Continuing with the working principle, the amount of moisture absorbed by the Lithium Chloride directly depends on the relative humidity of the environment.")
        text1.set_width(config.frame_width * 0.8)
        text1.move_to(ORIGIN)
        self.play(FadeIn(text1))
        self.wait(24.624761904761904)

        # Sentence 2
        self.play(FadeOut(text1))
        text2 = Text("If the relative humidity is high, the Lithium Chloride will absorb more moisture.")
        text2.set_width(config.frame_width * 0.8)
        self.play(FadeIn(text2))
        self.wait(24.624761904761904)

        # Sentence 3 (moisture absorption affects resistance, matching diagram)
        self.play(FadeOut(text2))
        text3 = Text("This increased moisture absorption leads to a decrease in its electrical resistance.")
        text3.set_width(config.frame_width * 0.8)
        image3 = ImageMobject("tmp/job_001/diagrams/page8_img0.png")
        image3.set_height(config.frame_height * 0.6)
        group3 = Group(text3, image3)
        group3.arrange(DOWN, buff=0.6)
        group3.set_height(config.frame_height * 0.8)
        group3.move_to(ORIGIN)
        self.play(FadeIn(group3))
        self.wait(24.624761904761904)

        # Sentence 4 (explanation of resistance values, suitable for resistance diagram)
        self.play(FadeOut(group3))
        text4 = Text("For instance, across a full range of 0 to 100% humidity, the resistance can vary significantly, typically from around 10^4 Ohms to 10^9 Ohms.")
        text4.set_width(config.frame_width * 0.8)
        image4 = ImageMobject("tmp/job_001/diagrams/page8_img1.png")
        image4.set_height(config.frame_height * 0.6)
        group4 = Group(text4, image4)
        group4.arrange(DOWN, buff=0.6)
        group4.set_height(config.frame_height * 0.8)
        group4.move_to(ORIGIN)
        self.play(FadeIn(group4))
        self.wait(24.624761904761904)

        # Sentence 5
        self.play(FadeOut(group4))
        text5 = Text("Essentially, Lithium Chloride exhibits very high resistance in a dry state, but when it comes into contact with moisture, its resistance drops considerably.")
        text5.set_width(config.frame_width * 0.8)
        self.play(FadeIn(text5))
        self.wait(24.624761904761904)
        self.play(FadeOut(text5))


class Scene9(Scene):
    def construct(self):
        narration_sentences = [
            "To convert the change in resistance into a measurable electrical signal, a signal conditioning circuit is used.",
            "One common method is to incorporate the hygrometer's sensing element into a Wheatstone bridge circuit, as shown on the left.",
            "Here, the resistive element, whose resistance changes with humidity, can be one of the arms of the bridge.",
            "By applying a voltage supply, the output voltage across the bridge becomes an indicator of the resistance change, and thus, the humidity.",
        ]

        for i, sentence in enumerate(narration_sentences):
            text = Text(sentence)
            text.set_width(config.frame_width * 0.8)
            text.move_to(ORIGIN)
            if i == 0:
                self.play(FadeIn(text))
            else:
                prev_text = self.mobjects[-1]
                self.play(FadeOut(prev_text), FadeIn(text))
            self.wait(36.710748299319725)

class Scene10(Scene):
    def construct(self):
        narration_sentences = [
            "Another way to condition the signal is by using a simple voltage divider circuit, as depicted in the middle diagram.",
            "In this setup, the resistive hygrometer, labeled Rs, is placed in series with a fixed resistor, R2.",
            "As the resistance of the hygrometer (Rs) changes with humidity, the voltage drop across it, and consequently the output voltage Vout, will vary.",
            "This varying output voltage can then be measured and correlated to the humidity level.",
        ]

        for i, sentence in enumerate(narration_sentences):
            text = Text(sentence)
            text.set_width(config.frame_width * 0.8)
            text.move_to(ORIGIN)
            if i == 0:
                self.play(FadeIn(text))
            else:
                prev_text = self.mobjects[-1]
                self.play(FadeOut(prev_text), FadeIn(text))
            self.wait(24.624761904761904)


class Scene11(Scene):
    def construct(self):
        narration_1 = "Finally, this block diagram illustrates the overall system for a resistive hygrometer."
        text_1 = Text(narration_1)
        text_1.set_width(config.frame_width * 0.8)
        text_1.move_to(ORIGIN)
        self.play(FadeIn(text_1))
        self.wait(36.7107482993197251)

        narration_2 = "The LiCl Hygrometer, which is our sensing element, generates a varying resistance based on humidity."
        text_2 = Text(narration_2)
        text_2.set_width(config.frame_width * 0.8)
        text_2.move_to(ORIGIN)
        self.play(FadeOut(text_1), FadeIn(text_2))
        self.wait(36.7107482993197251)

        narration_3 = "This signal then goes into the Signal Conditioning block, which could be a Wheatstone bridge or a voltage divider, converting the resistance change into a usable voltage or current signal."
        text_3 = Text(narration_3)
        text_3.set_width(config.frame_width * 0.8)
        text_3.move_to(ORIGIN)
        self.play(FadeOut(text_2), FadeIn(text_3))
        self.wait(36.7107482993197251)

        narration_4 = "This conditioned signal is then sent to a Display element, which presents the humidity reading to the user."
        text_4 = Text(narration_4)
        text_4.set_width(config.frame_width * 0.8)
        text_4.move_to(ORIGIN)
        self.play(FadeOut(text_3), FadeIn(text_4))
        self.wait(36.7107482993197251)

        self.play(FadeOut(text_4))
