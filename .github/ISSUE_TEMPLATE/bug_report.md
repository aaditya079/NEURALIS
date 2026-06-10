name: Bug Report
description: Report a bug or rendering issue in NEURALIS
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to report a bug! Please fill out the sections below.
  - type: textarea
    id: description
    attributes:
      label: Bug Description
      description: A clear and concise description of what the bug is.
      placeholder: E.g., The diff engine cuts off text when...
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Steps to Reproduce
      description: Detail the steps to reproduce the behavior.
      placeholder: |
        1. Load scenario X
        2. Drag timeline scrubber to step Y
        3. Observe...
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: A clear description of what you expected to happen.
    validations:
      required: true
  - type: textarea
    id: environment
    attributes:
      label: Environment Info
      description: E.g., OS, Browser version, Screen size
      placeholder: Windows 11, Chrome v120, 1920x1080
    validations:
      required: false
