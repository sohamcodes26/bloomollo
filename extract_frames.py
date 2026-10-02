import cv2
import os

VIDEO_PATH = r"C:\Users\soham\Downloads\Oct 01 - 19_31\Cybernetic_eyes_tracking_movement_20261001194404.mp4"

OUTPUT_DIR = r"C:\Users\soham\Downloads\Oct 01 - 19_31\eye_frames"

# Number of frames you want
NUM_FRAMES = 30

os.makedirs(OUTPUT_DIR, exist_ok=True)

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    raise RuntimeError("Could not open video.")

total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

duration = total_frames / fps

print("=" * 50)
print("VIDEO INFORMATION")
print("=" * 50)
print(f"Resolution : {width} x {height}")
print(f"FPS        : {fps}")
print(f"Frames     : {total_frames}")
print(f"Duration   : {duration:.2f} seconds")
print("=" * 50)

for i in range(NUM_FRAMES):

    # Evenly distribute frames across the entire video
    frame_number = round(
        i * (total_frames - 1) / (NUM_FRAMES - 1)
    )

    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)

    success, frame = cap.read()

    if not success:
        print(f"FAILED: frame {frame_number}")
        continue

    output_path = os.path.join(
        OUTPUT_DIR,
        f"frame_{i:02d}.webp"
    )

    cv2.imwrite(
        output_path,
        frame,
        [cv2.IMWRITE_WEBP_QUALITY, 95]
    )

    print(
        f"Saved {i + 1:02d}/{NUM_FRAMES} "
        f"→ video frame {frame_number}"
    )

cap.release()

print("\nDONE!")
print(f"Frames saved to:")
print(OUTPUT_DIR)