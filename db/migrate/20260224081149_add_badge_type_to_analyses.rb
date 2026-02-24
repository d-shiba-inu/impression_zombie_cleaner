class AddBadgeTypeToAnalyses < ActiveRecord::Migration[7.1]
  def change
    add_column :analyses, :badge_type, :string
  end
end
