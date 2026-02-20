# app/services/x_api/client.rb
module XApi
  class Client
    def fetch_user_data(username)
      # 今はまだ本物のAPIは叩かず、以前のロジックをここに移動するだけ！
      file_path = Rails.root.join('db', 'mock_data', 'zombies.json')
      zombies = JSON.parse(File.read(file_path))
      raw_data = zombies.sample

      # Gemが理解できる形式に整えて返す
      {
        'screen_name'     => raw_data['screen_name'],
        'followers_count' => raw_data['followers_count'],
        'following_count' => raw_data['following_count'],
        'description'     => raw_data['description'],
        'created_at'      => raw_data['created_at'] || "2026-01-01",
        'default_profile' => raw_data['default_profile'] || false, # ✨追加
        'statuses_count'  => raw_data['statuses_count'] || 0        # ✨追加
      }
    end
  end
end