require 'time'
require 'set'

module ZombieDetector
  class DuplicateChecker
    def initialize(replies)
      # 🌟 1. 投稿時間が古い順に並び替える（本家を先頭にするため）
      @replies = replies.sort_by { |r| Time.parse(r['created_at']) rescue Time.now }
    end

    def analyze
      seen_sets = []

      @replies.map do |reply|
        # --- 条件1: コピペ判定 (最大50点) ---
        # 文面を2文字ずつのセット(N-gram)にバラして比較精度を上げます
        current_set = make_ngram_set(reply['text'])
        max_sim = 0.0

        seen_sets.each do |target_set|
          sim = calculate_jaccard(current_set, target_set)
          max_sim = sim if sim > max_sim
        end
        
        # 類似度(0.0~1.0)を50点満点に換算
        jaccard_points = (max_sim * 50).to_i

        # --- 条件2〜4: 単体判定スコア (Detectorから取得) ---
        # 🌟 先ほど修正した Detector を呼び出して 50点満点のスコアをもらいます
        detector = Detector.new(reply)
        base_points = detector.score

        # 合計 150点満点
        total_score = jaccard_points + base_points

        # 🌟 RailsのコントローラーやReactが期待するキー名でデータを更新
        reply['similarity_rate'] = max_sim.round(3) # 0.854 のような形式
        reply['score'] = total_score                # 85 のような形式
        reply['is_zombie_copy'] = total_score >= 80 #  合計点が 80点以上ならゾンビ認定

        # 似ていない（オリジナル）投稿なら、以降の比較対象として記憶に追加
        # 類似度が低い(40%未満)かつ、空文字でない場合のみ保存
        if max_sim < 0.4 && !reply['text'].to_s.strip.empty?
          seen_sets << current_set
        end

        reply
      end
    end

    private

    # 文字列を2文字ずつのセットに分解するスリムなメソッド
    def make_ngram_set(text)
      return Set.new if text.nil? || text.strip.empty?
      text.chars.each_cons(2).map(&:join).to_set
    end

    # Jaccard係数の計算
    def calculate_jaccard(set1, set2)
      return 0.0 if set1.empty? || set2.empty?
      intersection = (set1 & set2).size.to_f
      union = (set1 | set2).size.to_f
      intersection / union
    end
  end
end