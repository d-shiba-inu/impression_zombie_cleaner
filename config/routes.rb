Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :analyses, only: [:index, :create] do
        collection do
          get :history # 🌟 これで /api/v1/analyses/history が有効になります
        end
      end
    end
  end

  # 🌟 「何もない場所」に来たら、frontendという場所へ案内する
  root "frontend#index"
  # 🌟 ReactのURL（/loginなど）をリロードしても大丈夫なようにする
  get "*path", to: "frontend#index", constraints: ->(req) { !req.xhr? && req.format.html? }
end