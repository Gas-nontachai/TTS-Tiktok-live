import argparse
import asyncio
from pathlib import Path


def edge_rate(speed: float) -> str:
    percent = round((speed - 1.0) * 100)
    percent = max(-50, min(100, percent))
    return f"{percent:+d}%"


async def synthesize(voice: str, text: str, speed: float, output: str):
    try:
        import edge_tts
    except ImportError as exc:
        raise SystemExit("AI Thai TTS dependency is not installed. Install it with: pip install edge-tts") from exc

    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(text=text, voice=voice, rate=edge_rate(speed))
    await communicate.save(str(output_path))


def main():
    parser = argparse.ArgumentParser(description="Generate Thai TTS audio with AI voices.")
    parser.add_argument("--voice", required=True)
    parser.add_argument("--text", required=True)
    parser.add_argument("--speed", type=float, default=1.0)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    asyncio.run(synthesize(args.voice, args.text, args.speed, args.output))


if __name__ == "__main__":
    main()
