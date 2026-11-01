"""PDF maintenance checks; run inside the requirements-resume.txt environment."""
from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/export-resume.py"
spec = importlib.util.spec_from_file_location("resume_export", SCRIPT)
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def semantics(path):
    reader = PdfReader(path)
    texts = [page.extract_text() or "" for page in reader.pages]
    links = []
    for page in reader.pages:
        for annotation in page.get("/Annots", []):
            action = annotation.get_object().get("/A", {})
            if action.get("/S") == "/URI":
                links.append(str(action["/URI"]))
    return {"text": texts, "links": sorted(links)}


class ResumeExportTests(unittest.TestCase):
    def test_repeatable_preview_preserves_published_artifacts(self):
        published = ROOT / "public/ethan-zhou-resume.pdf"
        published_manifest = published.with_suffix(".meta.json")
        before = {path: digest(path) for path in [published, published_manifest]}
        source_hash = digest(ROOT / "resume.html")
        with tempfile.TemporaryDirectory(prefix="resume-export-check-") as directory:
            outputs = [Path(directory) / name for name in ["first.pdf", "second.pdf"]]
            for output in outputs:
                run = subprocess.run(
                    [sys.executable, str(SCRIPT), "--output", str(output)],
                    cwd=ROOT, text=True, capture_output=True, timeout=45,
                )
                self.assertEqual(run.returncode, 0, run.stdout + run.stderr)
                report = json.loads(run.stdout)
                manifest = json.loads(output.with_suffix(".meta.json").read_text())
                self.assertEqual(report["pages"], 2)
                self.assertEqual(manifest["source_sha256"], source_hash)
                self.assertEqual(manifest["pdf_sha256"], digest(output))
                self.assertEqual(manifest["font_sha256"], exporter.FONT_SHA256)
                self.assertTrue(manifest["invariant_metadata"])
                self.assertEqual(set(manifest["dependencies"]), set(exporter.EXPORT_PACKAGES))
            self.assertEqual(outputs[0].read_bytes(), outputs[1].read_bytes(), "same environment must reproduce identical PDF bytes")
            # The current published PDF is a semantic baseline only when its
            # source matches. Intentional future resume edits need a fresh review.
            old_manifest = json.loads(published_manifest.read_text())
            if old_manifest["source_sha256"] == source_hash:
                self.assertEqual(semantics(outputs[0]), semantics(published))
        self.assertEqual(before, {path: digest(path) for path in before})

    def test_unverified_font_bytes_are_rejected_before_embedding(self):
        with patch.object(exporter.fitz, "Font", return_value=SimpleNamespace(buffer=b"changed-font-bytes")):
            with self.assertRaisesRegex(ValueError, "bundled CJK font differs"):
                exporter.register_fonts()


if __name__ == "__main__":
    unittest.main()
