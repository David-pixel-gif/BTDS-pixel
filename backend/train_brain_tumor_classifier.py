from __future__ import annotations

import argparse
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train a 14-class brain tumor classifier from a directory-of-folders dataset."
    )
    parser.add_argument("--data", type=Path, required=True, help="Dataset root. One subfolder per class.")
    parser.add_argument("--img-size", type=int, default=224)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--val-split", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().parent / "models" / "brain_tumor_14class.keras",
    )
    return parser.parse_args()


def import_tensorflow():
    try:
        import tensorflow as tf
    except ModuleNotFoundError as exc:
        version = f"{sys.version_info.major}.{sys.version_info.minor}"
        raise RuntimeError(
            "TensorFlow is not available in this Python environment. "
            f"Current interpreter: Python {version}. "
            "Use a Python 3.10 or 3.11 environment with a working TensorFlow install, "
            "then rerun training."
        ) from exc
    return tf


def main() -> None:
    args = parse_args()
    tf = import_tensorflow()
    data_dir = args.data.resolve()
    if not data_dir.exists():
        raise FileNotFoundError(f"Dataset path does not exist: {data_dir}")

    train_ds = tf.keras.utils.image_dataset_from_directory(
        data_dir,
        validation_split=args.val_split,
        subset="training",
        seed=args.seed,
        image_size=(args.img_size, args.img_size),
        batch_size=args.batch_size,
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        data_dir,
        validation_split=args.val_split,
        subset="validation",
        seed=args.seed,
        image_size=(args.img_size, args.img_size),
        batch_size=args.batch_size,
    )

    class_names = train_ds.class_names
    num_classes = len(class_names)
    if num_classes < 2:
        raise ValueError("At least two classes are required.")

    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.cache().shuffle(1000).prefetch(buffer_size=autotune)
    val_ds = val_ds.cache().prefetch(buffer_size=autotune)

    base_model = tf.keras.applications.EfficientNetB0(
        include_top=False,
        weights="imagenet",
        input_shape=(args.img_size, args.img_size, 3),
    )
    base_model.trainable = False

    inputs = tf.keras.Input(shape=(args.img_size, args.img_size, 3))
    x = tf.keras.layers.Rescaling(1.0 / 255)(inputs)
    x = base_model(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.2)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax")(x)
    model = tf.keras.Model(inputs, outputs)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_accuracy", patience=3, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.3, patience=2),
    ]

    history = model.fit(train_ds, validation_data=val_ds, epochs=args.epochs, callbacks=callbacks)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    model.save(args.output)

    labels_path = args.output.with_suffix(".labels.txt")
    labels_path.write_text("\n".join(class_names) + "\n", encoding="utf-8")

    best_val_acc = max(history.history.get("val_accuracy", [0.0]))
    print(f"Saved classifier to: {args.output}")
    print(f"Saved class labels to: {labels_path}")
    print(f"Classes: {', '.join(class_names)}")
    print(f"Best validation accuracy: {best_val_acc:.4f}")


if __name__ == "__main__":
    main()
