class AddDetailsToAnalyses < ActiveRecord::Migration[7.1]
  def change
    add_column :analyses, :reply_lang, :string
    add_column :analyses, :profile_lang, :string
  end
end
