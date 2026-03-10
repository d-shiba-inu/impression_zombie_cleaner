# 📺画面遷移図
### ✅お試し用のデモモードオンと本番用のデモモードオフの二つのモードがあります。</br>✅環境変数 DEMO_MODE を導入しております。
## デモモードオン
#### 📍X API取得に料金がかかるため、課金システムの体系が完成するまでは、お試し用のURL（実際のポストのURL）を用意してお試しいただける様にしております。
```mermaid
flowchart TD
    A["トップページ<br>TopPage"]
    B("Rails API<br>/api/v1/analyses/history")
    C["履歴エリア<br>SCAN HISTORY"]
    D["デモ案内看板<br>DEMO MODE"]
    E["URL入力エリア<br>Input Area"]
    F("Rails API<br>DBからデモデータ即時取得")
    G["結果表示エリア<br>DEFENSE LINE"]
    G1["25 / 50 / 100件表示"]
    C1["ZOMBIE / HUMAN のみ表示"]
    C2["履歴の SHOW / HIDE"]

    %% ロード時の動き（初回取得は裏側なので点線）
    A -.->|"1. 初回マウント (非同期)"| B
    B -->|"2. 履歴データ反映"| C
    A -->|"デモモード時のみ表示"| D

    %% ユーザー操作
    D -->|"Case A/B ボタンクリック"| E
    E -->|"URL自動入力"| E
    E -->|"RUN BULK クリック"| F

    F -.->|"解析中 Loading..."| F
    
    %% 🌟 メインとバックグラウンドを分ける（修正箇所: ===> を ==> に変更）
    F ==>|"3. デモデータ即時反映<br>(メインフロー)"| G
    F -.->|"4. 履歴を最新化<br>(裏側で同期)"| B

    %% 画面内のUI操作
    G -->|"表示件数変更"| G1
    C -->|"フィルター変更"| C1
    C -->|"トグル操作"| C2

    classDef default fill:#1a1a1a,stroke:#00ff00,stroke-width:2px,color:#fff;
    classDef api fill:#003300,stroke:#00ff00,stroke-width:2px,color:#fff,stroke-dasharray: 5 5;
    
    class B,F api;
``` 


## デモモードオフ
#### 📍デモモードをオフにすることで、X APIを取得して解析テストを行うことができます。
```mermaid
flowchart TD
    A["トップページ<br>TopPage"]
    B("Rails API<br>/api/v1/analyses/history")
    C["履歴エリア<br>SCAN HISTORY"]
    E["URL手動入力エリア<br>Input Area"]
    F("Rails API & Gem<br>X API通信 + 判定")
    G["結果表示エリア<br>DEFENSE LINE"]
    G1["25 / 50 / 100件表示"]
    C1["ZOMBIE / HUMAN のみ表示"]
    C2["履歴の SHOW / HIDE"]

    A -->|"1. 初回マウント"| B
    A -->|"デモ看板なし・直接入力へ"| E

    B -->|"2. DBから全履歴取得"| C

    E -->|"URLをコピペして<br>SCAN URL クリック"| F

    F -.->|"解析中 Loading..."| F
    
    %% 🌟 ここがポイント！太線と点線に分けて重なりを回避！（修正箇所: ===> を ==> に変更）
    F ==>|"3. リアルタイム解析完了<br>DB新規保存"| G
    F -.->|"4. 履歴を最新化<br>(裏側で同期)"| B

    G -->|"表示件数変更"| G1
    C -->|"フィルター変更"| C1
    C -->|"トグル操作"| C2

    classDef default fill:#1a1a1a,stroke:#00ff00,stroke-width:2px,color:#fff;
    classDef api fill:#003300,stroke:#00ff00,stroke-width:2px,color:#fff,stroke-dasharray: 5 5;
    classDef realApi fill:#4b0082,stroke:#ff00ff,stroke-width:2px,color:#fff,stroke-dasharray: 5 5;
    
    class B api;
    class F realApi;
```