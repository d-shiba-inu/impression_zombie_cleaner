# zombie_detector/zombie_detector.gemspec
# 商品のパッケージの裏側に、「商品名」「開発者」「バージョン」「依存関係」などを詳しく書き込む。
# .gemspec ファイルに Ruby 形式で情報を記述します。bundle install を実行する際、Bundler はこのファイルを読み取って中身を把握する。

require_relative "lib/zombie_detector/version"

Gem::Specification.new do |spec|
  spec.name          = "zombie_detector"
  spec.version       = ZombieDetector::VERSION
  spec.authors       = ["dshiba"] # 🌟 ご自身の名前を！
  spec.email         = ["@example.com"] # プログラミングアカウント未作成
  spec.summary       = "Twitter(X)のゾンビアカウントを判定するライブラリだワン！"
  spec.description   = "FF比、NGワード、アカウント作成日などを元にスコアを算出します。"
  spec.homepage      = "https://github.com/your_github_id/zombie_detector" # ダミーでもOK
  spec.license       = "MIT"

  # Gemに含まれるファイルの指定（規約通りのスリムなダイエット設定）
  spec.files         = Dir["lib/**/*", "README.md", "LICENSE.txt"]
  spec.require_paths = ["lib"]

  # 🌟 このGemが動くために必要な「他のGem」があればここに書きます
  spec.add_development_dependency "rspec", "~> 3.0"
end

