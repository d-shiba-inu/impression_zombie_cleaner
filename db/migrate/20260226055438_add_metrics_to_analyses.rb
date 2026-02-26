class AddMetricsToAnalyses < ActiveRecord::Migration[7.1]
  def change
    add_column :analyses, :followers_count, :integer
    add_column :analyses, :following_count, :integer
    add_column :analyses, :statuses_count, :integer
    add_column :analyses, :user_created_at, :datetime
  end
end
