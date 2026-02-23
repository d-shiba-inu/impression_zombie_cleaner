class Analysis < ApplicationRecord
  validates :url, presence: true
  validates :screen_name, presence: true
end
