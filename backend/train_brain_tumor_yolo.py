from __future__ import annotations

import argparse
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train a YOLO brain tumor detector using the local backend/brain-tumor dataset."
    )
    parser.add_argument(
        "--data",
        type=Path,
        default=Path(__file__).resolve().parent / "brain-tumor",
        help="Dataset root containing images/, labels/, and brain-tumor.yaml.",
    )
    parser.add_argument(
        "--config",
        type=Path,
        default=None,
        help="Optional dataset YAML path. Defaults to <data>/brain-tumor.yaml.",
    )
    parser.add_argument(
        "--model",
        default="yolo11n.pt",
        help="YOLO model config or weights to start from.",
    )
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--device", default="cpu", help="cpu, 0, 0,1, etc.")
    parser.add_argument("--workers", type=int, default=2)
    parser.add_argument(
        "--project",
        type=Path,
        default=Path(__file__).resolve().parent / "runs",
        help="Output directory for Ultralytics training runs.",
    )
    parser.add_argument("--name", default="brain_tumor_train")
    parser.add_argument("--exist-ok", action="store_true")
    return parser.parse_args()


def validate_dataset_root(dataset_root: Path) -> Path:
    dataset_root = dataset_root.resolve()
    required_dirs = [
        dataset_root / "images" / "train",
        dataset_root / "images" / "val",
        dataset_root / "labels" / "train",
        dataset_root / "labels" / "val",
    ]

    missing = [str(path) for path in required_dirs if not path.exists()]
    if missing:
        raise FileNotFoundError(
            "Dataset layout is incomplete. Missing:\n" + "\n".join(missing)
        )

    train_images = {path.stem for path in (dataset_root / "images" / "train").glob("*")}
    val_images = {path.stem for path in (dataset_root / "images" / "val").glob("*")}
    train_labels = {path.stem for path in (dataset_root / "labels" / "train").glob("*.txt")}
    val_labels = {path.stem for path in (dataset_root / "labels" / "val").glob("*.txt")}

    if not train_images:
        raise ValueError(f"No training images found in {dataset_root / 'images' / 'train'}")
    if not val_images:
        raise ValueError(f"No validation images found in {dataset_root / 'images' / 'val'}")

    extra_train_labels = sorted(train_labels - train_images)
    extra_val_labels = sorted(val_labels - val_images)
    if extra_train_labels or extra_val_labels:
        details = []
        if extra_train_labels:
            details.append(f"train labels without images: {len(extra_train_labels)}")
        if extra_val_labels:
            details.append(f"val labels without images: {len(extra_val_labels)}")
        raise ValueError("Dataset pairing check failed: " + ", ".join(details))

    train_backgrounds = len(train_images - train_labels)
    val_backgrounds = len(val_images - val_labels)
    print(
        f"Dataset summary: train_images={len(train_images)}, train_labels={len(train_labels)}, "
        f"train_backgrounds={train_backgrounds}, val_images={len(val_images)}, "
        f"val_labels={len(val_labels)}, val_backgrounds={val_backgrounds}"
    )

    return dataset_root


def build_dataset_yaml(config_path: Path, dataset_root: Path) -> Path:
    config_path.parent.mkdir(parents=True, exist_ok=True)
    config_path.write_text(
        "\n".join(
            [
                f"path: {dataset_root.as_posix()}",
                "train: images/train",
                "val: images/val",
                "names:",
                "  0: negative",
                "  1: positive",
                "",
            ]
        ),
        encoding="utf-8",
    )
    return config_path


def main() -> None:
    args = parse_args()
    dataset_root = validate_dataset_root(args.data)

    config_path = args.config.resolve() if args.config else dataset_root / "brain-tumor-local.yaml"
    config_path = build_dataset_yaml(config_path, dataset_root)

    try:
        from ultralytics import YOLO
    except ImportError as exc:
        raise SystemExit(
            "ultralytics is not installed. Install the YOLO stack first, then rerun this script."
        ) from exc

    try:
        model = YOLO(args.model)
    except FileNotFoundError:
        fallback_model = "yolo11n.yaml"
        print(f"Primary model '{args.model}' was not available. Falling back to '{fallback_model}'.")
        model = YOLO(fallback_model)
    results = model.train(
        data=str(config_path),
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=args.device,
        workers=args.workers,
        project=str(args.project.resolve()),
        name=args.name,
        exist_ok=args.exist_ok,
    )

    print(f"Training complete. Results saved to: {results.save_dir}")


if __name__ == "__main__":
    main()
