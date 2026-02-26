# zombie_detector/spec/zombie_detector_spec.rb
require "zombie_detector" # 自分のGemを読み込む

RSpec.describe ZombieDetector do
  let(:zombie_data) do
    {
      'screen_name' => 'zombie999999',  # 数字5つ以上 (+15)
      'followers_count' => 10,
      'following_count' => 1000,       # FF比 1.5以上 (+40)
      'description' => '副業で稼ぐ',      # NGワード2つ (+40)
      'created_at' => Time.now.to_s,   # 3ヶ月以内 (+30)
      'default_profile' => true,       # 初期アイコン (+20)
      'statuses_count' => 0            # 低ツイート (+25)
    }
  end

  it "スコアが正しく計算されること" do
    expect(ZombieDetector.score(zombie_data)).to be > 50
  end

  it "ゾンビ判定が true になること" do
    expect(ZombieDetector.zombie?(zombie_data)).to be true
  end

  it "全ての条件に当てはまる場合、スコアが100で頭打ちになること" do
    expect(ZombieDetector.score(zombie_data)).to eq 100
  end

  it "数字だらけの名前を検知できること" do
    data = { 'screen_name' => 'test12345', 'created_at' => '2020-01-01' }
    # 15点（名前） + 0点（他） = 15点
    expect(ZombieDetector.score(data)).to eq 15
  end
end