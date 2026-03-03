class FrontendController < ActionController::Base
  def index
    # Railsのレイアウトを使わず、Reactへ
    render file: Rails.root.join("public/index.html"), layout: false
  end
end