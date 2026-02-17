erDiagram
    categories ||--o{ posts : "contains"
    posts ||--o{ replies : "has"
    posts ||--o{ labels : "tagged with"
    replies ||--o{ zombie_reports : "triggers"

    categories {
        int id PK
        string genre
    }

    posts {
        int id PK
        string title
        string text
        string image
        datetime target_date
        int category_id FK
    }

    replies {
        int id PK
        string x_tweet_handle
        datetime tweeted_at
        float following_score
        int post_id FK
    }

    labels {
        int id PK
        int post_id FK
        datetime pressed_at
    }

    zombie_reports {
        int id PK
        int reply_id FK
        string created_labels
    }