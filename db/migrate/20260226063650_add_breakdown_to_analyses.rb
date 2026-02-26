class AddBreakdownToAnalyses < ActiveRecord::Migration[7.1]
  def change
    add_column :analyses, :breakdown, :json
  end
end
