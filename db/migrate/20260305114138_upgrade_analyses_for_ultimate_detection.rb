class UpgradeAnalysesForUltimateDetection < ActiveRecord::Migration[7.1]
  def change
    # 🌟 拡張性のために全データを保存する場所
    add_column :analyses, :raw_user_data, :json

    # 🌟 言語ミスマッチ判定のための重要項目
    add_column :analyses, :pinned_tweet_id, :string     # 固定ツイのID
    add_column :analyses, :pinned_tweet_text, :text     # 固定ツイの内容
    add_column :analyses, :pinned_tweet_lang, :string   # 固定ツイの言語
    add_column :analyses, :description_lang, :string    # プロフ本文の言語判定結果

    # 🌟 その他の怪しさ判定用メタデータ
    add_column :analyses, :location, :string            # 位置情報
    add_column :analyses, :profile_banner_url, :string  # ヘッダー画像があるか（ゾンビは無いことが多い）
    add_column :analyses, :listed_count, :integer        # リストに入れられている数（人間は多い）
    
    # 🌟 検索を速くするためのインデックス
    add_index :analyses, :pinned_tweet_id
  end
end
