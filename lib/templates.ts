import type { ExampleTemplate } from "@/types";

export const TEMPLATES: Record<ExampleTemplate, string> = {
  flowchart: `flowchart LR
  A[Start] --> B{Condition}
  B -->|Yes| C[Process]
  B -->|No| D[End]
  C --> D`,
  sequence: `sequenceDiagram
  participant U as User
  participant S as Server
  participant D as DB
  U->>S: Request
  S->>D: Query
  D-->>S: Result
  S-->>U: Response`,
  class: `classDiagram
  class Animal {
    +String name
    +move()
  }
  class Dog {
    +bark()
  }
  class Cat {
    +meow()
  }
  Animal <|-- Dog
  Animal <|-- Cat`,
  state: `stateDiagram-v2
  [*] --> Idle
  Idle --> Loading : fetch
  Loading --> Success : done
  Loading --> Error : fail
  Success --> [*]
  Error --> Loading : retry`,
};

export const TEMPLATE_LABELS: Record<ExampleTemplate, string> = {
  flowchart: "Flowchart",
  sequence: "Sequence",
  class: "Class",
  state: "State",
};
