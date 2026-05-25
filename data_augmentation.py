"""
Synthetic Dataset Generator for Citizenship Card Detection (YOLO Format)

Generates augmented training images by compositing citizenship card images
onto random backgrounds with various visual perturbations (rotation, blur,
brightness shifts, glare). Each image is saved alongside a YOLO-format
segmentation label file containing the card's bounding polygon.

Output structure:
    dataset/images/train/img_<N>.jpg
    dataset/labels/train/img_<N>.txt
"""

import os
import random
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw


# ── Configuration ─────────────────────────────────────────────────────────────

CARD_FOLDER = "Raw Citizenship Images/Front/Clean Images"
BACKGROUND_FOLDER = "Backgrounds/"

OUTPUT_IMAGES = "dataset/images/train"
OUTPUT_LABELS = "dataset/labels/train"

# Total number of synthetic images to generate
NUM_IMAGES = 500

# Output resolution (square); YOLO models commonly use 640×640
IMAGE_SIZE = 640

os.makedirs(OUTPUT_IMAGES, exist_ok=True)
os.makedirs(OUTPUT_LABELS, exist_ok=True)


# ── Load source files ──────────────────────────────────────────────────────────

card_files = [
    os.path.join(CARD_FOLDER, file)
    for file in os.listdir(CARD_FOLDER)
]

background_files = [
    os.path.join(BACKGROUND_FOLDER, file)
    for file in os.listdir(BACKGROUND_FOLDER)
]


# ── Helper functions ───────────────────────────────────────────────────────────

def add_glare(image):
    """
    Overlay a soft, semi-transparent white rectangle to simulate light glare.

    A vertical band of random width and horizontal position is drawn on a
    transparent layer, blurred with a Gaussian kernel, then alpha-composited
    onto the source image. This helps the model generalise to reflective card
    surfaces captured under varying lighting conditions.

    Args:
        image (PIL.Image.Image): Source image in any mode (will be converted
            to RGBA internally).

    Returns:
        PIL.Image.Image: RGBA image with the glare effect applied.
    """
    overlay = Image.new("RGBA", image.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)

    width, height = image.size

    glare_width = random.randint(80, 200)
    x1 = random.randint(0, width)
    y1 = 0
    x2 = x1 + glare_width
    y2 = height

    # Alpha between 30–70 keeps the glare visible but not overwhelming
    alpha = random.randint(30, 70)
    draw.rectangle([x1, y1, x2, y2], fill=(255, 255, 255, alpha))

    # Blur softens the hard rectangle edges into a realistic glow
    overlay = overlay.filter(ImageFilter.GaussianBlur(25))

    return Image.alpha_composite(image.convert("RGBA"), overlay)


def normalize_polygon(points, image_width, image_height):
    """
    Normalise pixel coordinates to the [0, 1] range expected by YOLO.

    YOLO segmentation labels store coordinates as fractions of the image
    dimensions, so (320, 320) in a 640×640 image becomes (0.5, 0.5).

    Args:
        points (list[tuple[int, int]]): Polygon vertices as (x, y) pixel pairs.
        image_width (int): Width of the full image in pixels.
        image_height (int): Height of the full image in pixels.

    Returns:
        list[float]: Flat list of normalised coordinates
            [x0, y0, x1, y1, ...] ready to join into a label string.
    """
    normalized = []
    for x, y in points:
        normalized.append(x / image_width)
        normalized.append(y / image_height)
    return normalized


# ── Dataset generation loop ────────────────────────────────────────────────────

for index in range(NUM_IMAGES):

    # Load a random card and ensure it has an alpha channel for compositing
    card_path = random.choice(card_files)
    card = Image.open(card_path).convert("RGBA")

    # Rotate the card slightly to simulate real-world placement angles
    angle = random.uniform(-20, 20)
    card = card.rotate(angle, expand=True)

    # Randomly shift brightness to account for different lighting environments
    brightness = ImageEnhance.Brightness(card)
    card = brightness.enhance(random.uniform(0.8, 1.2))

    # Apply mild blur in 40 % of cases to simulate camera defocus
    if random.random() < 0.4:
        card = card.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 1.5)))

    # Add specular glare in 50 % of cases to simulate reflective card surfaces
    if random.random() < 0.5:
        card = add_glare(card)

    # Load a random background and crop a random square region from it so
    # that the model sees varied background textures rather than a uniform tile
    bg_path = random.choice(background_files)
    background = Image.open(bg_path).convert("RGBA")

    bg_width, bg_height = background.size
    crop_size = random.randint(
        int(min(bg_width, bg_height) * 0.6),
        min(bg_width, bg_height)
    )
    crop_x = random.randint(0, bg_width - crop_size)
    crop_y = random.randint(0, bg_height - crop_size)

    background = background.crop((crop_x, crop_y, crop_x + crop_size, crop_y + crop_size))
    background = background.resize((IMAGE_SIZE, IMAGE_SIZE))

    # Scale the card to between 40–70 % of the canvas width, preserving aspect ratio
    scale = random.uniform(0.4, 0.7)
    card_width = int(IMAGE_SIZE * scale)
    aspect_ratio = card.height / card.width
    card_height = int(card_width * aspect_ratio)
    card = card.resize((card_width, card_height))

    # Place the card at a random position that keeps it fully within the canvas
    max_x = IMAGE_SIZE - card.width
    max_y = IMAGE_SIZE - card.height
    x = random.randint(0, max(0, max_x))
    y = random.randint(0, max(0, max_y))

    # Composite the card onto the background using its alpha channel as a mask
    mask = card.split()[-1]
    background.paste(card, (x, y), mask)

    # Convert to RGB (drops alpha) before saving as JPEG
    final_image = background.convert("RGB")

    # Re-save through JPEG compression to introduce realistic compression
    # artefacts and reduce file size, mimicking phone camera output
    temp_path = "temp.jpg"
    final_image.save(temp_path, quality=random.randint(60, 95))
    final_image = Image.open(temp_path)

    # Save the finished training image
    image_name = f"img_{index}.jpg"
    image_path = os.path.join(OUTPUT_IMAGES, image_name)
    final_image.save(image_path)

    # Build the axis-aligned bounding polygon for the card (four corners in
    # clockwise order starting from the top-left) and normalise to [0, 1]
    corners = [
        (x, y),
        (x + card.width, y),
        (x + card.width, y + card.height),
        (x, y + card.height),
    ]
    polygon = normalize_polygon(corners, IMAGE_SIZE, IMAGE_SIZE)

    # Write the YOLO segmentation label: class_id followed by flat polygon coords
    # Class 0 corresponds to "citizenship_card" as defined in the dataset YAML
    label_name = f"img_{index}.txt"
    label_path = os.path.join(OUTPUT_LABELS, label_name)
    with open(label_path, "w") as file:
        polygon_string = " ".join(map(str, polygon))
        file.write(f"0 {polygon_string}")

print("Dataset generation complete.")