erDiagram
    posts ||--o{ replies : "has many"
    posts ||--o{ labels : "has many"
    categories ||--o{ posts : "categorizes"
    replies ||--o{ zombie_reports : "generates"

    posts {
        int id
        string title
        string text
        string image
        datetime target_date
        int genve_id
    }

    replies {
        int id
        string x_tweet_handle
        datetime tt_wehet_date
        float following_score
    }

    labels {
        int id
        int post_id
        datetime pressed_at
    }

    categories {
        int id
        string genre
    }

    zombie_reports {
        int id
        int resery_id
        string crdaded_labels
    }