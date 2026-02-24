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
  er: `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE-ITEM : contains
  CUSTOMER {
    string name
    string email
  }
  ORDER {
    int orderNumber
    date orderDate
  }
  LINE-ITEM {
    string productId
    int quantity
  }`,
  mindmap: `mindmap
  root((MermaidGPT))
    Editor
      Monaco
      Syntax
    Preview
      Pan
      Zoom
    AI
      Fix
      Improve
      Generate`,
  architecture: `architecture-beta
group api(cloud)[API]

service db(database)[Database] in api
service cache(disk)[Storage] in api
service server(server)[Server] in api

db:R -- L:server
cache:T -- B:server`,
  gantt: `gantt
  title Project Timeline
  dateFormat YYYY-MM-DD
  section Phase 1
  Research    :a1, 2024-01-01, 14d
  Design      :a2, after a1, 7d
  section Phase 2
  Development :b1, after a2, 21d
  Testing     :b2, after b1, 14d
  section Launch
  Deploy      :c1, after b2, 3d`,
  pie: `pie title Browser usage
  "Chrome" : 45
  "Safari" : 25
  "Firefox" : 20
  "Edge" : 10`,
  journey: `journey
  title User signs in
  section Landing
    Open app: 5: User
    Click sign in: 4: User
  section Auth
    Redirect to Google: 5: User
    Enter credentials: 3: User
  section Success
    See editor: 5: User`,
  gitGraph: `gitGraph
  commit id: "Initial"
  commit id: "Feature A"
  branch develop
  checkout develop
  commit id: "WIP"
  checkout main
  merge develop
  commit id: "Release"`,
  block: `block-beta
  columns 3
  A[UI] B[State]
  C[API Server]
  D[(Database)]
  A --> C
  B --> C
  C --> D`,
  timeline: `timeline
  title Product roadmap
  section 2024 Q1
    Launch MVP : First release
    Beta feedback : Collect input
  section 2024 Q2
    v1.1 : New features
    Integrations : API
  section 2024 Q3
    Scale : Performance
    Enterprise : SSO`,
  c4: `C4Context
  title System Context - MermaidGPT
  Person(user, "User", "Engineer editing diagrams")
  System_Boundary(app, "MermaidGPT") {
    System(editor, "Web App", "Editor, preview, AI assistant")
  }
  System_Ext(openai, "OpenAI", "GPT API")
  Rel(user, editor, "Uses")
  Rel(editor, openai, "Calls")`,
};

export const TEMPLATE_LABELS: Record<ExampleTemplate, string> = {
  flowchart: "Flowchart",
  sequence: "Sequence",
  class: "Class",
  state: "State",
  er: "Entity Relationship",
  mindmap: "Mindmap",
  architecture: "Architecture",
  gantt: "Gantt",
  pie: "Pie",
  journey: "User Journey",
  gitGraph: "Git Graph",
  block: "Block",
  timeline: "Timeline",
  c4: "C4 Context",
};
