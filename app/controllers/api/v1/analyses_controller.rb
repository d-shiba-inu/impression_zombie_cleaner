class Api::V1::AnalysesController < ApplicationController
  def create
    url = params[:url]
    
    # ここで本来はゾンビチェックをしますが、まずは「受け取ったよ」と返事をするだけ
    render json: { 
      status: 'success', 
      message: "RailsがURL「#{url}」を受け取ったワン！🐾",
      is_zombie: [true, false].sample # ランダムで結果を返してみる
    }
  end
end