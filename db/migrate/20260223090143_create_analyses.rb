class CreateAnalyses < ActiveRecord::Migration[7.1]
  def change
    create_table :analyses do |t|
      t.string :url, index: true
      t.string :name
      t.string :screen_name
      t.text :text
      t.float :similarity_rate
      t.integer :score
      t.boolean :is_zombie
      t.boolean :verified
      t.text :description

      t.timestamps
    end
  end
end
