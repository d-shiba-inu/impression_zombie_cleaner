# spec/lib/zombie_detector/detector_spec.rb
require 'spec_helper'
require './lib/zombie_detector/detector.rb'

RSpec.describe ZombieDetector::Detector do
  describe "#score" do
    # 1. 完璧なゾンビのテスト
    context "典型的なゾンビデータの場合" do
      let(:zombie_user) do
        {
          "screen_name" => "zombie_bot",
          "description" => "副業で稼ぐ！",
          "followers_count" => 10,
          "following_count" => 1000,
          "created_at" => Time.now.to_s
        }
      end

      it "高スコア（100点）を返すこと" do
        detector = ZombieDetector::Detector.new(zombie_user)
        expect(detector.score).to eq(100)
      end
    end

    # 2. 完璧な人間のテスト
    context "善良な一般ユーザーの場合" do
      let(:human_user) do
        {
          "screen_name" => "ruby_lover",
          "description" => "プログラミング勉強中です。猫が好きです。",
          "followers_count" => 500,
          "following_count" => 450,
          "created_at" => (Time.now - 5 * 365 * 24 * 60 * 60).to_s # 5年前
        }
      end

      it "低スコア（0点）を返すこと" do
        detector = ZombieDetector::Detector.new(human_user)
        expect(detector.score).to eq(0)
      end
    end
    # 3. 判定が難しいグレーゾーンのテスト
    context "相互フォローでフォロワーを増やしているが、怪しいワードはない場合" do
      let(:active_user) do
        {
          "screen_name" => "follow_back_lover",
          "description" => "旅行と写真が大好きです！無言フォロー失礼します。",
          "followers_count" => 1000,
          "following_count" => 1600, # FF比 1.6倍（+40点）
          "created_at" => (Time.now - 365 * 24 * 60 * 60).to_s # 1年前（0点）
        }
      end

      it "スコアが40点になり、ゾンビとは判定されないこと（50点未満）" do
        detector = ZombieDetector::Detector.new(active_user)
        expect(detector.score).to eq(40)
      end
    end

    # 4. 新規作成ホヤホヤの怪しいアカウント
    context "作成直後で、説明文に1つだけNGワードがある場合" do
      let(:new_suspect) do
        {
          "screen_name" => "new_user_123",
          "description" => "副業に興味あります", # 「副業」だけがヒットする（+20点）
          "followers_count" => 10,
          "following_count" => 10, # FF比 1.0倍（0点）
          "created_at" => Time.now.to_s # 作成直後（+30点）
        }
      end

      it "スコアが50点（30+20）になり、ゾンビと判定されること" do
        detector = ZombieDetector::Detector.new(new_suspect)
        expect(detector.score).to eq(50)
      end
    end
  end
end