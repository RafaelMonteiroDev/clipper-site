"""App icon for the Google, TikTok and Meta consoles: black square, "clipper" in white Anton and
the yellow dot (#FFE500), square corners. Writes icon-120.png, icon-512.png and icon-1024.png here.

    python make.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
FONT = Path("D:/DEV/clip-pipeline/tools/fonts/Anton-Regular.ttf")
YELLOW, WHITE, BLACK = (255, 229, 0), (255, 255, 255), (0, 0, 0)


def icon(size: int = 1024) -> Image.Image:
    img = Image.new("RGB", (size, size), BLACK)
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(str(FONT), int(size * 0.27))
    word, dot = "clipper", "."
    w_word = draw.textlength(word, font=font)
    w_dot = draw.textlength(dot, font=font)
    left = (size - (w_word + w_dot)) / 2
    top, bottom = font.getbbox(word)[1], font.getbbox(word)[3]
    y = (size - (bottom - top)) / 2 - top
    draw.text((left, y), word, font=font, fill=WHITE)
    draw.text((left + w_word, y), dot, font=font, fill=YELLOW)
    return img


if __name__ == "__main__":
    big = icon(1024)
    for n in (1024, 512, 120):
        big.resize((n, n), Image.LANCZOS).save(HERE / f"icon-{n}.png")
