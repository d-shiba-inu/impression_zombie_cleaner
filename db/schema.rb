# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2026_02_26_063650) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "analyses", force: :cascade do |t|
    t.string "url"
    t.string "name"
    t.string "screen_name"
    t.text "text"
    t.float "similarity_rate"
    t.integer "score"
    t.boolean "is_zombie"
    t.boolean "verified"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "badge_type"
    t.string "reply_lang"
    t.string "profile_lang"
    t.integer "followers_count"
    t.integer "following_count"
    t.integer "statuses_count"
    t.datetime "user_created_at"
    t.json "breakdown"
    t.index ["url"], name: "index_analyses_on_url"
  end

end
