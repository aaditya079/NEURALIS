name: Feature Request
description: Suggest a new idea, scenario, or enhancement for NEURALIS
labels: ["enhancement"]
body:
  - type: markdown
    attributes:
      value: |
        Have a creative idea or a way to improve the agentic console? Suggest it here!
  - type: textarea
    id: summary
    attributes:
      label: Feature Summary
      description: What would you like to add?
      placeholder: E.g., Add a database visual graph panel to...
    validations:
      required: true
  - type: textarea
    id: problem
    attributes:
      label: Problem Statement / Use Case
      description: What problem does this solve, or what value does it add to the simulation console?
    validations:
      required: true
  - type: textarea
    id: details
    attributes:
      label: Implementation Ideas
      description: Any initial thoughts on how to code this in vanilla ES6 or style it insidestyles.css?
    validations:
      required: false
