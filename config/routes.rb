Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :analyses, only: [:index, :create]
        collection do
          get :history # 🌟 これで /api/v1/analyses/history が有効になります
        end
    end
  end
end