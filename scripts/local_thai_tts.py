import argparse
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Generate Thai TTS audio with local models.")
    parser.add_argument("--engine", choices=["thonburian", "jaitts-f5tts"], required=True)
    parser.add_argument("--text", required=True)
    parser.add_argument("--reference-audio", required=True)
    parser.add_argument("--reference-text", required=True)
    parser.add_argument("--speed", type=float, default=1.0)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    reference_audio = Path(args.reference_audio)
    if not reference_audio.exists():
        raise SystemExit(f"Reference audio not found: {reference_audio}")

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        import torch
        import soundfile as sf
        from flowtts.inference import AudioConfig, FlowTTSPipeline, ModelConfig
    except ImportError as exc:
        raise SystemExit(
            "Local Thai TTS dependencies are not installed. "
            "Install them with: pip install torch cached-path librosa transformers f5-tts "
            "git+https://github.com/biodatlab/thonburian-tts.git"
        ) from exc

    checkpoint, vocab_file = model_files(args.engine)
    model_config = ModelConfig(
        language="th",
        model_type="F5",
        checkpoint=checkpoint,
        vocab_file=vocab_file,
        vocoder="vocos",
        device="cuda" if torch.cuda.is_available() else "cpu",
    )
    audio_config = AudioConfig(
        silence_threshold=-45,
        cfg_strength=2.5,
        speed=args.speed,
    )

    pipeline = FlowTTSPipeline(model_config, audio_config)

    if args.engine == "jaitts-f5tts":
        audio, sample_rate = pipeline.generate(
            reference_audio=str(reference_audio),
            reference_text=args.reference_text,
            gen_text=args.text,
        )
        sf.write(output_path, audio, sample_rate)
        return

    pipeline(
        text=args.text,
        ref_voice=str(reference_audio),
        ref_text=args.reference_text,
        output_file=str(output_path),
    )


def model_files(engine):
    if engine == "jaitts-f5tts":
        return (
            "hf://JTS-AI/JaiTTS-F5TTS/model.pt",
            "hf://JTS-AI/JaiTTS-F5TTS/vocab.txt",
        )

    return (
        "hf://biodatlab/ThonburianTTS/megaF5/mega_f5_last.safetensors",
        "hf://biodatlab/ThonburianTTS/megaF5/mega_vocab.txt",
    )


if __name__ == "__main__":
    main()
